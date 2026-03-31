import { Inject, Injectable } from '@nestjs/common';
import { Invoice, InvoiceLineProps } from '../../domain/entities/invoice.entity';
import { Money } from '../../domain/value-objects/money';
import {
  InvoiceRepository,
  INVOICE_REPOSITORY,
} from '../../domain/repositories/invoice.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';
import { v4 as uuidv4 } from 'uuid';

export interface CreateInvoiceInput {
  customerId: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxCode: string | null;
    taxRate: number;
    accountId: string;
  }[];
  notes: string | null;
  tenantId: string;
  createdBy: string;
}

@Injectable()
export class PostInvoiceUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepo: InvoiceRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async createAndSend(input: CreateInvoiceInput): Promise<{ id: string; invoiceNumber: string }> {
    const invoiceNumber = await this.invoiceRepo.nextInvoiceNumber(input.tenantId);

    const lines: InvoiceLineProps[] = input.lines.map((l) => {
      const lineTotal = Money.create(l.quantity * l.unitPrice, input.currency);
      const taxAmount = Money.create(
        (l.quantity * l.unitPrice * l.taxRate) / 100,
        input.currency,
      );
      return {
        id: uuidv4(),
        description: l.description,
        quantity: l.quantity,
        unitPrice: Money.create(l.unitPrice, input.currency),
        taxCode: l.taxCode,
        taxAmount,
        lineTotal,
        accountId: l.accountId,
      };
    });

    const invoice = Invoice.create({
      invoiceNumber,
      customerId: input.customerId,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      lines,
      currency: input.currency,
      tenantId: input.tenantId,
      notes: input.notes,
      createdBy: input.createdBy,
    });

    invoice.send();

    const saved = await this.invoiceRepo.saveWithOutbox(invoice);

    await this.cache.delByPattern(`invoice:${input.tenantId}:*`);

    const events = saved.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }

    return { id: saved.id, invoiceNumber };
  }

  async applyPayment(
    invoiceId: string,
    amount: number,
    currency: string,
    tenantId: string,
  ): Promise<void> {
    const invoice = await this.invoiceRepo.findById(invoiceId, tenantId);
    if (!invoice) {
      throw new EntityNotFoundException('Invoice', invoiceId);
    }

    invoice.applyPayment(Money.create(amount, currency));

    await this.invoiceRepo.saveWithOutbox(invoice);

    await this.cache.delByPattern(`invoice:${tenantId}:*`);

    const events = invoice.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }
  }
}
