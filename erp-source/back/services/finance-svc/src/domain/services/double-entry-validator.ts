import { JournalEntry, JournalLineProps } from '../entities/journal-entry.entity';
import { Money } from '../value-objects/money';

/**
 * Domain service: validates double-entry accounting invariants.
 * Pure logic — no infrastructure imports.
 */
export class DoubleEntryValidator {
  /** Validates that a set of journal lines balances (debits = credits) */
  static validate(lines: JournalLineProps[]): ValidationResult {
    if (lines.length < 2) {
      return {
        valid: false,
        error: 'A journal entry must have at least 2 lines',
      };
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of lines) {
      totalDebits += line.baseCurrencyDebit.amountAsNumber;
      totalCredits += line.baseCurrencyCredit.amountAsNumber;

      // A line should have either debit OR credit, not both
      if (
        line.baseCurrencyDebit.amountAsNumber > 0 &&
        line.baseCurrencyCredit.amountAsNumber > 0
      ) {
        return {
          valid: false,
          error: `Line ${line.id}: cannot have both debit and credit amounts`,
        };
      }

      // A line must have at least one non-zero amount
      if (
        line.baseCurrencyDebit.amountAsNumber === 0 &&
        line.baseCurrencyCredit.amountAsNumber === 0
      ) {
        return {
          valid: false,
          error: `Line ${line.id}: must have either a debit or credit amount`,
        };
      }
    }

    if (Math.abs(totalDebits - totalCredits) > 0.0001) {
      return {
        valid: false,
        error: `Debits (${totalDebits.toFixed(4)}) ≠ Credits (${totalCredits.toFixed(4)})`,
      };
    }

    return { valid: true };
  }

  /** Validates a complete journal entry */
  static validateEntry(entry: JournalEntry): ValidationResult {
    return this.validate([...entry.lines]);
  }
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
