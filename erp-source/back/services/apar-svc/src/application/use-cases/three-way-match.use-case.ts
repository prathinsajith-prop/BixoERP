import { Inject, Injectable } from '@nestjs/common';
import {
  VendorInvoice,
  ThreeWayMatchResult,
  VendorInvoiceStatus,
} from '../../domain/entities/vendor-invoice.entity';
import { Money } from '../../domain/value-objects/money';
import {
  VendorInvoiceRepository,
  VENDOR_INVOICE_REPOSITORY,
} from '../../domain/repositories/vendor-invoice.repository';
import { EventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port';
import { CachePort, CACHE_PORT } from '../ports/cache.port';
import {
  EntityNotFoundException,
  BusinessRuleViolation,
  ThreeWayMatchFailedException,
} from '../../domain/exceptions/domain.exceptions';

/**
 * Input from the external PO/Receipt data
 * (fetched via gRPC or events from procurement-svc / inventory-svc)
 */
export interface ThreeWayMatchInput {
  vendorInvoiceId: string;
  tenantId: string;
  purchaseOrder: {
    poNumber: string;
    totalAmount: number;
    currency: string;
    lines: {
      lineId: string;
      quantity: number;
      unitPrice: number;
    }[];
  };
  goodsReceipt: {
    receiptNumber: string;
    lines: {
      purchaseOrderLineId: string;
      quantityReceived: number;
    }[];
  };
}

export interface ThreeWayMatchOutput {
  invoiceId: string;
  status: string;
  matchResult: ThreeWayMatchResult;
}

@Injectable()
export class ThreeWayMatchUseCase {
  /** Tolerance for amount variance (0.01 = 1 cent) */
  private readonly VARIANCE_TOLERANCE = 0.01;

  constructor(
    @Inject(VENDOR_INVOICE_REPOSITORY)
    private readonly invoiceRepo: VendorInvoiceRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisher,
    @Inject(CACHE_PORT)
    private readonly cache: CachePort,
  ) {}

  async execute(input: ThreeWayMatchInput): Promise<ThreeWayMatchOutput> {
    const invoice = await this.invoiceRepo.findById(input.vendorInvoiceId, input.tenantId);
    if (!invoice) {
      throw new EntityNotFoundException('VendorInvoice', input.vendorInvoiceId);
    }

    if (invoice.status !== VendorInvoiceStatus.PENDING_MATCH) {
      throw new BusinessRuleViolation(
        `Invoice ${invoice.invoiceNumber} is not pending match (status: ${invoice.status})`,
      );
    }

    // 1) Validate PO total matches invoice total
    const poTotal = Money.create(input.purchaseOrder.totalAmount, input.purchaseOrder.currency);
    const invoiceTotal = invoice.total;
    const poAmountMatches = Math.abs(
      poTotal.amountAsNumber - invoiceTotal.amountAsNumber,
    ) <= this.VARIANCE_TOLERANCE;

    // 2) Validate quantities: each invoice line's PO line must have matching goods receipt
    let quantitiesMatch = true;
    const invoiceLines = invoice.lines;

    for (const invoiceLine of invoiceLines) {
      if (!invoiceLine.purchaseOrderLineId) continue;

      const poLine = input.purchaseOrder.lines.find(
        (pl) => pl.lineId === invoiceLine.purchaseOrderLineId,
      );
      if (!poLine) {
        quantitiesMatch = false;
        break;
      }

      const receiptLine = input.goodsReceipt.lines.find(
        (rl) => rl.purchaseOrderLineId === invoiceLine.purchaseOrderLineId,
      );
      if (!receiptLine) {
        quantitiesMatch = false;
        break;
      }

      // Invoice qty must match receipt qty (what was actually received)
      if (invoiceLine.quantity !== receiptLine.quantityReceived) {
        quantitiesMatch = false;
        break;
      }

      // PO unit price must match invoice unit price
      if (
        Math.abs(poLine.unitPrice - invoiceLine.unitPrice.amountAsNumber) > this.VARIANCE_TOLERANCE
      ) {
        quantitiesMatch = false;
        break;
      }
    }

    // 3) Build match result
    const variance = poAmountMatches
      ? null
      : Money.create(
          Math.abs(poTotal.amountAsNumber - invoiceTotal.amountAsNumber),
          invoice.currency,
        );

    const matchResult: ThreeWayMatchResult = {
      poMatched: poAmountMatches,
      receiptMatched: quantitiesMatch,
      invoiceMatched: poAmountMatches && quantitiesMatch,
      poNumber: input.purchaseOrder.poNumber,
      receiptNumber: input.goodsReceipt.receiptNumber,
      varianceAmount: variance,
    };

    // 4) Apply match result to domain
    invoice.recordMatchResult(matchResult);

    const saved = await this.invoiceRepo.saveWithOutbox(invoice);

    await this.cache.delByPattern(`vendor-invoice:${input.tenantId}:*`);

    const events = saved.clearDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events);
    }

    return {
      invoiceId: saved.id,
      status: saved.status,
      matchResult,
    };
  }
}
