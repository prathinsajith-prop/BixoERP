import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, LessThan } from 'typeorm';
import { Invoice, InvoiceStatus, InvoiceLineProps } from '../../../domain/entities/invoice.entity';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository';
import { InvoiceOrmEntity } from '../entities/invoice.orm-entity';
import { InvoiceLineOrmEntity } from '../entities/invoice-line.orm-entity';
import { OutboxEventOrmEntity } from '../entities/outbox-event.orm-entity';
import { Money } from '../../../domain/value-objects/money';

@Injectable()
export class PostgresInvoiceRepository implements InvoiceRepository {
    constructor(
        @InjectRepository(InvoiceOrmEntity)
        private readonly repo: Repository<InvoiceOrmEntity>,
        private readonly dataSource: DataSource,
    ) { }

    async findById(id: string, tenantId: string): Promise<Invoice | null> {
        const row = await this.repo.findOne({ where: { id, tenantId }, relations: ['lines'] });
        return row ? this.toDomain(row) : null;
    }

    async findByInvoiceNumber(number: string, tenantId: string): Promise<Invoice | null> {
        const row = await this.repo.findOne({
            where: { invoiceNumber: number, tenantId },
            relations: ['lines'],
        });
        return row ? this.toDomain(row) : null;
    }

    async findByCustomer(customerId: string, tenantId: string): Promise<Invoice[]> {
        const rows = await this.repo.find({
            where: { customerId, tenantId },
            relations: ['lines'],
            order: { createdAt: 'DESC' },
        });
        return rows.map((r) => this.toDomain(r));
    }

    async findOverdue(tenantId: string): Promise<Invoice[]> {
        const rows = await this.repo.find({
            where: [
                { tenantId, status: InvoiceStatus.SENT, dueDate: LessThan(new Date()) },
                { tenantId, status: InvoiceStatus.PARTIALLY_PAID, dueDate: LessThan(new Date()) },
            ],
            relations: ['lines'],
            order: { dueDate: 'ASC' },
        });
        return rows.map((r) => this.toDomain(r));
    }

    async findByStatus(status: string, tenantId: string): Promise<Invoice[]> {
        const rows = await this.repo.find({
            where: { status, tenantId },
            relations: ['lines'],
            order: { createdAt: 'DESC' },
        });
        return rows.map((r) => this.toDomain(r));
    }

    async save(invoice: Invoice): Promise<Invoice> {
        const entity = this.toOrm(invoice);
        const saved = await this.repo.save(entity);
        return this.toDomain(saved);
    }

    async update(invoice: Invoice): Promise<Invoice> {
        return this.save(invoice);
    }

    async nextInvoiceNumber(tenantId: string): Promise<string> {
        const result = await this.repo
            .createQueryBuilder('inv')
            .select('COUNT(*)', 'count')
            .where('inv.tenant_id = :tenantId', { tenantId })
            .getRawOne();
        const seq = parseInt(result.count, 10) + 1;
        return `INV-${String(seq).padStart(6, '0')}`;
    }

    /** Save invoice + outbox events in the SAME transaction (Outbox Pattern) */
    async saveWithOutbox(invoice: Invoice): Promise<Invoice> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const entity = this.toOrm(invoice);
            const savedInvoice = await queryRunner.manager.save(InvoiceOrmEntity, entity);

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
            return this.toDomain(savedInvoice);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private toDomain(row: InvoiceOrmEntity): Invoice {
        const currency = row.currency;
        const lines: InvoiceLineProps[] = (row.lines || []).map((l) => ({
            id: l.id,
            description: l.description,
            quantity: parseFloat(l.quantity),
            unitPrice: Money.create(l.unitPrice, l.currency),
            taxCode: l.taxCode,
            taxAmount: Money.create(l.taxAmount, l.currency),
            lineTotal: Money.create(l.lineTotal, l.currency),
            accountId: l.accountId,
        }));

        return Invoice.fromPersistence(
            {
                invoiceNumber: row.invoiceNumber,
                customerId: row.customerId,
                issueDate: row.issueDate,
                dueDate: row.dueDate,
                status: row.status as InvoiceStatus,
                lines,
                subtotal: Money.create(row.subtotal, currency),
                taxTotal: Money.create(row.taxTotal, currency),
                total: Money.create(row.total, currency),
                amountPaid: Money.create(row.amountPaid, currency),
                currency,
                tenantId: row.tenantId,
                notes: row.notes,
                createdBy: row.createdBy,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
            },
            row.id,
        );
    }

    private toOrm(invoice: Invoice): InvoiceOrmEntity {
        const entity = new InvoiceOrmEntity();
        entity.id = invoice.id;
        entity.invoiceNumber = invoice.invoiceNumber;
        entity.customerId = invoice.customerId;
        entity.issueDate = invoice.issueDate;
        entity.dueDate = invoice.dueDate;
        entity.status = invoice.status;
        entity.subtotal = invoice.subtotal.amount;
        entity.taxTotal = invoice.taxTotal.amount;
        entity.total = invoice.total.amount;
        entity.amountPaid = invoice.amountPaid.amount;
        entity.currency = invoice.currency;
        entity.tenantId = invoice.tenantId;
        entity.notes = invoice.notes;
        entity.createdBy = invoice.createdBy;
        entity.createdAt = invoice.createdAt;
        entity.updatedAt = invoice.updatedAt;

        entity.lines = invoice.lines.map((l) => {
            const line = new InvoiceLineOrmEntity();
            line.id = l.id;
            line.invoiceId = invoice.id;
            line.description = l.description;
            line.quantity = String(l.quantity);
            line.unitPrice = l.unitPrice.amount;
            line.taxCode = l.taxCode;
            line.taxAmount = l.taxAmount.amount;
            line.lineTotal = l.lineTotal.amount;
            line.accountId = l.accountId;
            line.currency = l.unitPrice.currency;
            return line;
        });

        return entity;
    }
}
