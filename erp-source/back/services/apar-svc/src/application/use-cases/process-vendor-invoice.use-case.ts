import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  VendorInvoice,
  VendorInvoiceLineProps,
} from '../../domain/entities/vendor-invoice.entity';
import { Money } from '../../domain/value-objects/money';
import {
  VendorInvoiceRepository,
  VENDOR_INVOICE_REPOSITORY,
} from '../../domain/repositories/vendor-invoice.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import {
  DuplicateEntryException,
} from '../../domain/exceptions/domain.exceptions';

export interface ProcessVendorInvoiceInput {
  vendorId: string;
  vendorInvoiceRef: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  paymentTermsCode: string;
  purchaseOrderId: string | null;
  goodsReceiptId: string | null;
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxCode: string | null;
    taxRate: number;
    accountId: string;
    purchaseOrderLineId: string | null;
  }[];
  notes: string | null;
  tenantId: string;
  createdBy: string;
  idempotencyKey?: string;
}

export interface ProcessVendorInvoiceOutput {
  id: string;
  invoiceNumber: string;
  status: string;
  total: string;
}

@Injectable()
export class ProcessVendorInvoiceUseCase {
  constructor(
    @Inject(VENDOR_INVOICE_REPOSITORY)
    private readonly invoiceRepo: VendorInvoiceRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: ProcessVendorInvoiceInput): Promise<ProcessVendorInvoiceOutput> {
    // Idempotency check
    if (input.idempotencyKey) {
      const exists = await this.invoiceRepo.existsByIdempotencyKey(
        input.idempotencyKey,
        input.tenantId,
      );
      if (exists) {
        throw new DuplicateEntryException('idempotencyKey', input.idempotencyKey);
      }
    }

    // Build invoice lines with Money value objects
    const lines: VendorInvoiceLineProps[] = input.lines.map((l) => {
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
        purchaseOrderLineId: l.purchaseOrderLineId,
      };
    });

    const invoiceNumber = await this.invoiceRepo.nextInvoiceNumber(input.tenantId);

    const invoice = VendorInvoice.create({
      invoiceNumber,
      vendorId: input.vendorId,
      vendorInvoiceRef: input.vendorInvoiceRef,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      lines,
      currency: input.currency,
      paymentTermsCode: input.paymentTermsCode,
      purchaseOrderId: input.purchaseOrderId,
      goodsReceiptId: input.goodsReceiptId,
      tenantId: input.tenantId,
      notes: input.notes,
      createdBy: input.createdBy,
    });

    // If a PO is referenced, auto-submit for 3-way matching
    if (input.purchaseOrderId) {
      invoice.submitForMatch();
    }

    const saved = await this.invoiceRepo.saveWithOutbox(invoice);

    await this.cache.delByPattern(`vendor-invoice:${input.tenantId}:*`);

    const events = saved.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }

    return {
      id: saved.id,
      invoiceNumber: saved.invoiceNumber,
      status: saved.status,
      total: saved.total.toString(),
    };
  }
}
