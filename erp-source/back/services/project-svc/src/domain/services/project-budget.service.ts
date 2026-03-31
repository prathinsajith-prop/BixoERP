import { ProjectBudget } from '../entities/project-budget.entity';
import { Money } from '../value-objects/money';

export interface BudgetVarianceResult {
  projectId: string;
  totalBudget: string;
  totalActualCost: string;
  totalVariance: string;
  laborBudget: string;
  actualLaborCost: string;
  laborVariance: string;
  materialBudget: string;
  actualMaterialCost: string;
  materialVariance: string;
  percentUsed: number;
  isExceeded: boolean;
}

/**
 * Domain service: calculates budget variance for projects.
 * Pure logic — no infrastructure imports.
 */
export class ProjectBudgetService {
  static calculateVariance(budget: ProjectBudget): BudgetVarianceResult {
    const totalActual = budget.totalActualCost;
    const budgetAmount = budget.totalBudget.amountAsNumber;
    const actualAmount = totalActual.amountAsNumber;
    const percentUsed = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;

    return {
      projectId: budget.projectId,
      totalBudget: budget.totalBudget.toString(),
      totalActualCost: totalActual.toString(),
      totalVariance: budget.totalVariance.toString(),
      laborBudget: budget.laborBudget.toString(),
      actualLaborCost: budget.actualLaborCost.toString(),
      laborVariance: budget.laborVariance.toString(),
      materialBudget: budget.materialBudget.toString(),
      actualMaterialCost: budget.actualMaterialCost.toString(),
      materialVariance: budget.materialVariance.toString(),
      percentUsed: Math.round(percentUsed * 100) / 100,
      isExceeded: budget.isBudgetExceeded,
    };
  }

  static isOverThreshold(budget: ProjectBudget, thresholdPercent: number): boolean {
    const budgetAmount = budget.totalBudget.amountAsNumber;
    if (budgetAmount <= 0) return false;
    const actualAmount = budget.totalActualCost.amountAsNumber;
    const percentUsed = (actualAmount / budgetAmount) * 100;
    return percentUsed >= thresholdPercent;
  }
}
