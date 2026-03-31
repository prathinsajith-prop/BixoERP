import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  PaymentRun,
  PaymentRunLineProps,
  PaymentMethod,
} from '../../domain/entities/payment-run.entity';
import { Money } from '../../domain/value-objects/money';
import {
  PaymentRunRepository,
  PAYMENT_RUN_REPOSITORY,
} from '../../domain/repositories/payment-run.repository';
import {
  VendorInvoiceRepository,
  VENDOR_INVOICE_REPOSITORY,
} from '../../domain/repositories/vendor-invoice.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import {
  EntityNotFoundException,
  BusinessRuleViolation,
} from '../../domain/exceptions/domain.exceptions';
import { VendorInvoiceStatus } from '../../domain/entities/vendor-invoice.entity';
import { PaymentTerms } from '../../domain/value-objects/payment-terms';

export interface ExecutePaymentRunInput {
  description: string;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  currency: string;
  bankAccountId: string;
  vendorInvoiceIds: string[];
  tenantId: string;
  createdBy: string;
}

export interface ExecutePaymentRunOutput {
  id: string;
  runNumber: string;
  status: string;
  totalNet: string;
  lineCount: number;
}

@Injectable()
export class ExecutePaymentRunUseCase {
  constructor(
    @Inject(PAYMENT_RUN_REPOSITORY)
    private readonly paymentRunRepo: PaymentRunRepository,
    @Inject(VENDOR_INVOICE_REPOSITORY)
    private readonly invoiceRepo: VendorInvoiceRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: ExecutePaymentRunInput): Promise<ExecutePaymentRunOutput> {
    // Validate all invoices exist and are approved
    const lines: PaymentRunLineProps[] = [];

    for (const invoiceId of input.vendorInvoiceIds) {
      const invoice = await this.invoiceRepo.findById(invoiceId, input.tenantId);
      if (!invoice) {
        throw new EntityNotFoundException('VendorInvoice', invoiceId);
      }
      if (
        invoice.status !== VendorInvoiceStatus.APPROVED &&
        invoice.status !== VendorInvoiceStatus.PARTIALLY_PAID
      ) {
        throw new BusinessRuleViolation(
          `Invoice ${invoice.invoiceNumber} is not in a payable status: ${invoice.status}`,
        );
      }
      if (invoice.currency !== input.currency) {
        throw new BusinessRuleViolation(
          `Invoice ${invoice.invoiceNumber} currency (${invoice.currency}) does not match payment currency (${input.currency})`,
        );
      }

      const balance = invoice.balance;
      const terms = invoice.paymentTerms;

      // Calculate early payment discount if applicable
      let discountAmount = Money.zero(input.currency);
      if (terms.hasDiscount && terms.isEligibleForDiscount(input.paymentDate, invoice.issueDate)) {
        discountAmount = balance.multiply(terms.discountPercent / 100);
      }
      const netAmount = balance.subtract(discountAmount);

      lines.push({
        id: uuidv4(),
        vendorInvoiceId: invoiceId,
        vendorId: invoice.vendorId,
        amount: balance,
        discountAmount,
        netAmount,
        status: 'PENDING',
        failureReason: null,
      });
    }

    if (lines.length === 0) {
      throw new BusinessRuleViolation('Payment run must contain at least one invoice');
    }

    const runNumber = await this.paymentRunRepo.nextRunNumber(input.tenantId);

    const paymentRun = PaymentRun.create({
      runNumber,
      description: input.description,
      paymentDate: input.paymentDate,
      paymentMethod: input.paymentMethod,
      lines,
      currency: input.currency,
      bankAccountId: input.bankAccountId,
      tenantId: input.tenantId,
      createdBy: input.createdBy,
    });

    const saved = await this.paymentRunRepo.saveWithOutbox(paymentRun);

    await this.cache.delByPattern(`payment-run:${input.tenantId}:*`);

    const events = saved.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }

    return {
      id: saved.id,
      runNumber: saved.runNumber,
      status: saved.status,
      totalNet: saved.totalNet.toString(),
      lineCount: saved.lines.length,
    };
  }

  /** Approve and begin processing a payment run */
  async approveAndProcess(
    paymentRunId: string,
    approvedBy: string,
    tenantId: string,
  ): Promise<void> {
    const run = await this.paymentRunRepo.findById(paymentRunId, tenantId);
    if (!run) {
      throw new EntityNotFoundException('PaymentRun', paymentRunId);
    }

    run.approve(approvedBy);
    run.startProcessing();

    // Process each line — apply payment to the corresponding invoice
    for (const line of run.lines) {
      try {
        const invoice = await this.invoiceRepo.findById(line.vendorInvoiceId, tenantId);
        if (!invoice) {
          run.markLineFailed(line.id, 'Invoice not found');
          continue;
        }
        invoice.applyPayment(line.netAmount);
        await this.invoiceRepo.saveWithOutbox(invoice);
        run.markLinePaid(line.id);
      } catch (error) {
        run.markLineFailed(line.id, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    run.complete();

    const saved = await this.paymentRunRepo.saveWithOutbox(run);

    await this.cache.delByPattern(`payment-run:${tenantId}:*`);
    await this.cache.delByPattern(`vendor-invoice:${tenantId}:*`);

    const events = saved.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }
  }
}
