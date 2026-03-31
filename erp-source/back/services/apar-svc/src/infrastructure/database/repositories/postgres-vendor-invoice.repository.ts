import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  VendorInvoice,
  VendorInvoiceStatus,
  VendorInvoiceLineProps,
  ThreeWayMatchResult,
} from '../../../domain/entities/vendor-invoice.entity';
import { VendorInvoiceRepository } from '../../../domain/repositories/vendor-invoice.repository';
import { VendorInvoiceOrmEntity } from '../entities/vendor-invoice.orm-entity';
import { VendorInvoiceLineOrmEntity } from '../entities/vendor-invoice-line.orm-entity';
import { OutboxEventOrmEntity } from '../entities/outbox-event.orm-entity';
import { Money } from '../../../domain/value-objects/money';
import { PaymentTerms } from '../../../domain/value-objects/payment-terms';

@Injectable()
export class PostgresVendorInvoiceRepository implements VendorInvoiceRepository {
  constructor(
    @InjectRepository(VendorInvoiceOrmEntity)
    private readonly repo: Repository<VendorInvoiceOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string, tenantId: string): Promise<VendorInvoice | null> {
    const row = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['lines'],
    });
    return row ? this.toDomain(row) : null;
  }

  async findByInvoiceNumber(number: string, tenantId: string): Promise<VendorInvoice | null> {
    const row = await this.repo.findOne({
      where: { invoiceNumber: number, tenantId },
      relations: ['lines'],
    });
    return row ? this.toDomain(row) : null;
  }

  async findByVendor(vendorId: string, tenantId: string): Promise<VendorInvoice[]> {
    const rows = await this.repo.find({
      where: { vendorId, tenantId },
      relations: ['lines'],
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByStatus(status: string, tenantId: string): Promise<VendorInvoice[]> {
    const rows = await this.repo.find({
      where: { status, tenantId },
      relations: ['lines'],
      order: { dueDate: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findOverdue(tenantId: string): Promise<VendorInvoice[]> {
    const rows = await this.repo
      .createQueryBuilder('vi')
      .leftJoinAndSelect('vi.lines', 'lines')
      .where('vi.tenant_id = :tenantId', { tenantId })
      .andWhere('vi.status NOT IN (:...excluded)', {
        excluded: [VendorInvoiceStatus.PAID, VendorInvoiceStatus.VOID],
      })
      .andWhere('vi.due_date < :now', { now: new Date() })
      .orderBy('vi.due_date', 'ASC')
      .getMany();
    return rows.map((r) => this.toDomain(r));
  }

  async findApprovedUnpaid(tenantId: string): Promise<VendorInvoice[]> {
    const rows = await this.repo.find({
      where: [
        { status: VendorInvoiceStatus.APPROVED, tenantId },
        { status: VendorInvoiceStatus.PARTIALLY_PAID, tenantId },
      ],
      relations: ['lines'],
      order: { dueDate: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByPurchaseOrder(poId: string, tenantId: string): Promise<VendorInvoice[]> {
    const rows = await this.repo.find({
      where: { purchaseOrderId: poId, tenantId },
      relations: ['lines'],
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(invoice: VendorInvoice): Promise<VendorInvoice> {
    const entity = this.toOrm(invoice);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(invoice: VendorInvoice): Promise<VendorInvoice> {
    return this.save(invoice);
  }

  async nextInvoiceNumber(tenantId: string): Promise<string> {
    const result = await this.repo
      .createQueryBuilder('vi')
      .select('COUNT(*)', 'count')
      .where('vi.tenant_id = :tenantId', { tenantId })
      .getRawOne();
    const seq = parseInt(result.count, 10) + 1;
    return `VI-${String(seq).padStart(6, '0')}`;
  }

  async existsByIdempotencyKey(key: string, tenantId: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { idempotencyKey: key, tenantId },
    });
    return count > 0;
  }

  async saveWithOutbox(invoice: VendorInvoice): Promise<VendorInvoice> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entity = this.toOrm(invoice);
      const savedEntity = await queryRunner.manager.save(VendorInvoiceOrmEntity, entity);

      const domainEvents = invoice.domainEvents;
      for (const event of domainEvents) {
        const outbox = new OutboxEventOrmEntity();
        outbox.eventId = event.eventId;
        outbox.eventType = event.eventType;
        outbox.aggregateId = event.aggregateId;
        outbox.tenantId = event.tenantId;
        outbox.payload = event.payload;
        outbox.processed = false;
        await queryRunner.manager.save(OutboxEventOrmEntity, outbox);
      }

      await queryRunner.commitTransaction();
      return this.toDomain(savedEntity);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private toDomain(row: VendorInvoiceOrmEntity): VendorInvoice {
    const currency = row.currency;

    const lines: VendorInvoiceLineProps[] = (row.lines || []).map((l) => ({
      id: l.id,
      description: l.description,
      quantity: parseFloat(l.quantity),
      unitPrice: Money.create(l.unitPrice, currency),
      taxCode: l.taxCode,
      taxAmount: Money.create(l.taxAmount, currency),
      lineTotal: Money.create(l.lineTotal, currency),
      accountId: l.accountId,
      purchaseOrderLineId: l.purchaseOrderLineId,
    }));

    let threeWayMatch: ThreeWayMatchResult | null = null;
    if (row.threeWayMatch) {
      const m = row.threeWayMatch;
      threeWayMatch = {
        poMatched: m.poMatched as boolean,
        receiptMatched: m.receiptMatched as boolean,
        invoiceMatched: m.invoiceMatched as boolean,
        poNumber: (m.poNumber as string) ?? null,
        receiptNumber: (m.receiptNumber as string) ?? null,
        varianceAmount: m.varianceAmount
          ? Money.create(m.varianceAmount as number, currency)
          : null,
      };
    }

    return VendorInvoice.fromPersistence(
      {
        invoiceNumber: row.invoiceNumber,
        vendorId: row.vendorId,
        vendorInvoiceRef: row.vendorInvoiceRef,
        issueDate: row.issueDate,
        dueDate: row.dueDate,
        status: row.status as VendorInvoiceStatus,
        lines,
        subtotal: Money.create(row.subtotal, currency),
        taxTotal: Money.create(row.taxTotal, currency),
        total: Money.create(row.total, currency),
        amountPaid: Money.create(row.amountPaid, currency),
        currency,
        paymentTerms: PaymentTerms.fromCode(row.paymentTermsCode),
        purchaseOrderId: row.purchaseOrderId,
        goodsReceiptId: row.goodsReceiptId,
        threeWayMatch,
        tenantId: row.tenantId,
        notes: row.notes,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toOrm(invoice: VendorInvoice): VendorInvoiceOrmEntity {
    const entity = new VendorInvoiceOrmEntity();
    entity.id = invoice.id;
    entity.invoiceNumber = invoice.invoiceNumber;
    entity.vendorId = invoice.vendorId;
    entity.vendorInvoiceRef = invoice.vendorInvoiceRef;
    entity.issueDate = invoice.issueDate;
    entity.dueDate = invoice.dueDate;
    entity.status = invoice.status;
    entity.subtotal = invoice.subtotal.amount;
    entity.taxTotal = invoice.taxTotal.amount;
    entity.total = invoice.total.amount;
    entity.amountPaid = invoice.amountPaid.amount;
    entity.currency = invoice.currency;
    entity.paymentTermsCode = invoice.paymentTerms.code;
    entity.purchaseOrderId = invoice.purchaseOrderId;
    entity.goodsReceiptId = invoice.goodsReceiptId;
    entity.threeWayMatch = invoice.threeWayMatch
      ? {
          poMatched: invoice.threeWayMatch.poMatched,
          receiptMatched: invoice.threeWayMatch.receiptMatched,
          invoiceMatched: invoice.threeWayMatch.invoiceMatched,
          poNumber: invoice.threeWayMatch.poNumber,
          receiptNumber: invoice.threeWayMatch.receiptNumber,
          varianceAmount: invoice.threeWayMatch.varianceAmount?.amountAsNumber ?? null,
        }
      : null;
    entity.tenantId = invoice.tenantId;
    entity.notes = invoice.notes;
    entity.createdBy = invoice.createdBy;
    entity.createdAt = invoice.createdAt;

    entity.lines = invoice.lines.map((l) => {
      const line = new VendorInvoiceLineOrmEntity();
      line.id = l.id;
      line.vendorInvoiceId = invoice.id;
      line.description = l.description;
      line.quantity = l.quantity.toFixed(4);
      line.unitPrice = l.unitPrice.amount;
      line.taxCode = l.taxCode;
      line.taxAmount = l.taxAmount.amount;
      line.lineTotal = l.lineTotal.amount;
      line.accountId = l.accountId;
      line.purchaseOrderLineId = l.purchaseOrderLineId;
      line.currency = invoice.currency;
      return line;
    });

    return entity;
  }
}
