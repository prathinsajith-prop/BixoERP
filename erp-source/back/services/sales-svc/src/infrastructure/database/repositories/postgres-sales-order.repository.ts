import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SalesOrder, SalesOrderProps, OrderLineProps } from '../../../domain/entities/sales-order.entity';
import { SalesOrderRepository } from '../../../domain/repositories/sales-order.repository';
import { SalesOrderOrmEntity } from '../entities/sales-order.orm-entity';
import { SalesOrderLineOrmEntity } from '../entities/sales-order-line.orm-entity';
import { OutboxEventOrmEntity } from '../entities/outbox-event.orm-entity';
import { Money } from '../../../domain/value-objects/money';
import { OrderStatus } from '../../../domain/value-objects/order-status';

@Injectable()
export class PostgresSalesOrderRepository implements SalesOrderRepository {
  constructor(
    @InjectRepository(SalesOrderOrmEntity)
    private readonly orderRepo: Repository<SalesOrderOrmEntity>,
    @InjectRepository(SalesOrderLineOrmEntity)
    private readonly lineRepo: Repository<SalesOrderLineOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string, tenantId: string): Promise<SalesOrder | null> {
    const row = await this.orderRepo.findOne({ where: { id, tenantId } });
    if (!row) return null;
    const lines = await this.lineRepo.find({
      where: { orderId: id, tenantId },
      order: { productName: 'ASC' },
    });
    return this.toDomain(row, lines);
  }

  async findByOrderNumber(orderNumber: string, tenantId: string): Promise<SalesOrder | null> {
    const row = await this.orderRepo.findOne({ where: { orderNumber, tenantId } });
    if (!row) return null;
    const lines = await this.lineRepo.find({
      where: { orderId: row.id, tenantId },
    });
    return this.toDomain(row, lines);
  }

  async findByCustomer(customerId: string, tenantId: string): Promise<SalesOrder[]> {
    const rows = await this.orderRepo.find({
      where: { customerId, tenantId },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(
      rows.map(async (r) => {
        const lines = await this.lineRepo.find({ where: { orderId: r.id, tenantId } });
        return this.toDomain(r, lines);
      }),
    );
  }

  async findByStatus(status: string, tenantId: string): Promise<SalesOrder[]> {
    const rows = await this.orderRepo.find({
      where: { status, tenantId },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(
      rows.map(async (r) => {
        const lines = await this.lineRepo.find({ where: { orderId: r.id, tenantId } });
        return this.toDomain(r, lines);
      }),
    );
  }

  async findAll(tenantId: string): Promise<SalesOrder[]> {
    const rows = await this.orderRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(
      rows.map(async (r) => {
        const lines = await this.lineRepo.find({ where: { orderId: r.id, tenantId } });
        return this.toDomain(r, lines);
      }),
    );
  }

  async save(order: SalesOrder): Promise<SalesOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entity = this.toOrderOrm(order);
      await queryRunner.manager.save(SalesOrderOrmEntity, entity);

      // Delete existing lines and re-insert
      await queryRunner.manager.delete(SalesOrderLineOrmEntity, { orderId: order.id });
      const lineEntities = this.toLineOrms(order);
      if (lineEntities.length > 0) {
        await queryRunner.manager.save(SalesOrderLineOrmEntity, lineEntities);
      }

      await queryRunner.commitTransaction();
      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async saveWithOutbox(order: SalesOrder): Promise<SalesOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entity = this.toOrderOrm(order);
      await queryRunner.manager.save(SalesOrderOrmEntity, entity);

      // Delete existing lines and re-insert
      await queryRunner.manager.delete(SalesOrderLineOrmEntity, { orderId: order.id });
      const lineEntities = this.toLineOrms(order);
      if (lineEntities.length > 0) {
        await queryRunner.manager.save(SalesOrderLineOrmEntity, lineEntities);
      }

      // Write domain events to outbox in same transaction
      const domainEvents = order.domainEvents;
      for (const event of domainEvents) {
        const outbox = new OutboxEventOrmEntity();
        outbox.eventId = event.eventId;
        outbox.eventType = event.eventType;
        outbox.aggregateId = event.aggregateId;
        outbox.tenantId = event.tenantId;
        outbox.payload = event.payload;
        outbox.processed = false;
        outbox.processedAt = null;
        await queryRunner.manager.save(OutboxEventOrmEntity, outbox);
      }

      await queryRunner.commitTransaction();
      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async nextOrderNumber(tenantId: string): Promise<string> {
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select('COUNT(*)', 'count')
      .where('o.tenant_id = :tenantId', { tenantId })
      .getRawOne();
    const seq = parseInt(result.count, 10) + 1;
    return `SO-${String(seq).padStart(6, '0')}`;
  }

  // ── Mapping ────────────────────────────────────────

  private toDomain(row: SalesOrderOrmEntity, lineRows: SalesOrderLineOrmEntity[]): SalesOrder {
    const currency = row.currency;
    const lines: OrderLineProps[] = lineRows.map((l) => ({
      id: l.id,
      productId: l.productId,
      productName: l.productName,
      quantity: l.quantity,
      unitPrice: Money.create(l.unitPrice, currency),
      discount: parseFloat(l.discount),
      lineTotal: Money.create(l.lineTotal, currency),
    }));

    const props: SalesOrderProps = {
      orderNumber: row.orderNumber,
      customerId: row.customerId,
      customerName: row.customerName,
      status: row.status as OrderStatus,
      lines,
      currency,
      subtotal: Money.create(row.subtotal, currency),
      taxRate: parseFloat(row.taxRate),
      taxAmount: Money.create(row.taxAmount, currency),
      totalAmount: Money.create(row.totalAmount, currency),
      notes: row.notes,
      quotationId: row.quotationId,
      tenantId: row.tenantId,
      createdBy: row.createdBy,
      confirmedAt: row.confirmedAt,
      fulfilledAt: row.fulfilledAt,
      cancelledAt: row.cancelledAt,
      cancellationReason: row.cancellationReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    return SalesOrder.fromPersistence(props, row.id);
  }

  private toOrderOrm(order: SalesOrder): SalesOrderOrmEntity {
    const entity = new SalesOrderOrmEntity();
    entity.id = order.id;
    entity.orderNumber = order.orderNumber;
    entity.customerId = order.customerId;
    entity.customerName = order.customerName;
    entity.status = order.status;
    entity.currency = order.currency;
    entity.subtotal = order.subtotal.amount;
    entity.taxRate = order.taxRate.toFixed(2);
    entity.taxAmount = order.taxAmount.amount;
    entity.totalAmount = order.totalAmount.amount;
    entity.notes = order.notes;
    entity.quotationId = order.quotationId;
    entity.tenantId = order.tenantId;
    entity.createdBy = order.createdBy;
    entity.confirmedAt = order.confirmedAt;
    entity.fulfilledAt = order.fulfilledAt;
    entity.cancelledAt = order.cancelledAt;
    entity.cancellationReason = order.cancellationReason;
    entity.createdAt = order.createdAt;
    entity.updatedAt = order.updatedAt;
    return entity;
  }

  private toLineOrms(order: SalesOrder): SalesOrderLineOrmEntity[] {
    return order.lines.map((line) => {
      const entity = new SalesOrderLineOrmEntity();
      entity.id = line.id;
      entity.orderId = order.id;
      entity.productId = line.productId;
      entity.productName = line.productName;
      entity.quantity = line.quantity;
      entity.unitPrice = line.unitPrice.amount;
      entity.discount = line.discount.toFixed(2);
      entity.lineTotal = line.lineTotal.amount;
      entity.tenantId = order.tenantId;
      return entity;
    });
  }
}
