import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget, BudgetLineProps, BudgetProps, BudgetStatus } from '../../../domain/entities/budget.entity';
import { BudgetRepository } from '../../../domain/repositories/budget.repository';
import { BudgetOrmEntity } from '../entities/budget.orm-entity';
import { BudgetLineOrmEntity } from '../entities/budget-line.orm-entity';
import { Money } from '../../../domain/value-objects/money';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PostgresBudgetRepository implements BudgetRepository {
    constructor(
        @InjectRepository(BudgetOrmEntity)
        private readonly repo: Repository<BudgetOrmEntity>,
    ) { }

    async findAll(tenantId: string): Promise<Budget[]> {
        const rows = await this.repo.find({
            where: { tenantId },
            relations: ['lines'],
            order: { fiscalYear: 'DESC' },
        });
        return rows.map((r) => this.toDomain(r));
    }

    async findById(id: string, tenantId: string): Promise<Budget | null> {
        const row = await this.repo.findOne({
            where: { id, tenantId },
            relations: ['lines'],
        });
        return row ? this.toDomain(row) : null;
    }

    async save(budget: Budget): Promise<Budget> {
        const entity = this.toOrm(budget);
        const saved = await this.repo.save(entity);
        return this.toDomain(saved);
    }

    async update(budget: Budget): Promise<Budget> {
        const entity = this.toOrm(budget);
        const saved = await this.repo.save(entity);
        return this.toDomain(saved);
    }

    private toDomain(row: BudgetOrmEntity): Budget {
        const lines: BudgetLineProps[] = (row.lines ?? []).map((l) => ({
            id: l.id,
            accountId: l.accountId,
            period: l.period,
            amount: Money.create(l.amount, l.currency),
            actual: Money.create(l.actual, l.currency),
        }));

        return Budget.fromPersistence(
            {
                name: row.name,
                fiscalYear: row.fiscalYear,
                status: row.status as BudgetStatus,
                lines,
                tenantId: row.tenantId,
                createdBy: row.createdBy,
                approvedBy: row.approvedBy,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
            } as BudgetProps,
            row.id,
        );
    }

    private toOrm(budget: Budget): BudgetOrmEntity {
        const entity = new BudgetOrmEntity();
        entity.id = budget.id;
        entity.name = budget.name;
        entity.fiscalYear = budget.fiscalYear;
        entity.status = budget.status;
        entity.tenantId = budget.tenantId;
        // Access protected props via reflection for createdBy/approvedBy
        const p = (budget as unknown as { props: BudgetProps }).props;
        entity.createdBy = p.createdBy;
        entity.approvedBy = p.approvedBy;
        entity.lines = budget.lines.map((l) => {
            const line = new BudgetLineOrmEntity();
            line.id = l.id ?? uuidv4();
            line.budgetId = budget.id;
            line.accountId = l.accountId;
            line.period = l.period;
            line.amount = l.amount.amount;
            line.actual = l.actual.amount;
            line.currency = l.amount.currency;
            return line;
        });
        return entity;
    }
}
