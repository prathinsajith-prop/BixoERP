import { Money } from '../value-objects/money';
import { PayrollLineProps } from '../entities/payroll-run.entity';
import { Employee } from '../entities/employee.entity';
import { v4 as uuidv4 } from 'uuid';

/**
 * Domain service: pure payroll calculation logic.
 * No infrastructure imports — only domain types.
 */
export class PayrollCalculationService {
  /** Calculate net pay for a single employee */
  static calculateEmployeePay(
    employee: Employee,
    allowances: number,
    deductions: number,
    taxRate: number,
  ): PayrollLineProps {
    const currency = employee.currency;
    const baseSalary = employee.baseSalary;
    const allowanceMoney = Money.create(allowances, currency);
    const deductionMoney = Money.create(deductions, currency);

    const grossPay = baseSalary.add(allowanceMoney);
    const taxableAmount = grossPay.subtract(deductionMoney);
    const taxAmount = Money.create(
      Math.max(0, taxableAmount.amountAsNumber * (taxRate / 100)),
      currency,
    );

    const totalDeductions = deductionMoney.add(taxAmount);
    const netPay = grossPay.subtract(totalDeductions);

    return {
      id: uuidv4(),
      employeeId: employee.id,
      baseSalary,
      allowances: allowanceMoney,
      deductions: deductionMoney,
      taxAmount,
      netPay,
      currency,
    };
  }

  /** Calculate payroll for a batch of employees */
  static calculateBatch(
    employees: Employee[],
    allowancesMap: Map<string, number>,
    deductionsMap: Map<string, number>,
    taxRate: number,
  ): PayrollLineProps[] {
    return employees.map((emp) => {
      const allowances = allowancesMap.get(emp.id) ?? 0;
      const deductions = deductionsMap.get(emp.id) ?? 0;
      return PayrollCalculationService.calculateEmployeePay(
        emp,
        allowances,
        deductions,
        taxRate,
      );
    });
  }

  /** Validate that all net pays are non-negative */
  static validatePayrollLines(lines: PayrollLineProps[]): ValidationResult {
    for (const line of lines) {
      if (line.netPay.isNegative()) {
        return {
          valid: false,
          error: `Employee ${line.employeeId} has negative net pay: ${line.netPay.toString()}`,
        };
      }
    }
    return { valid: true };
  }
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
