import { Budget } from '../entities/budget.entity';

export interface BudgetRepository {
    findAll(tenantId: string): Promise<Budget[]>;
    findById(id: string, tenantId: string): Promise<Budget | null>;
    save(budget: Budget): Promise<Budget>;
    update(budget: Budget): Promise<Budget>;
}

export const BUDGET_REPOSITORY = Symbol('BudgetRepository');
