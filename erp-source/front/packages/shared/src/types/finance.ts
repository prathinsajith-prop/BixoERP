import type { AuditFields, Currency, Money } from "./common";

// ─── Finance ─────────────────────────────────

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type NormalBalance = "debit" | "credit";
export type FiscalPeriodStatus = "open" | "soft-closed" | "hard-closed";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  parentId: string | null;
  isActive: boolean;
}

export interface JournalEntry extends AuditFields {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  status: "draft" | "posted" | "reversed";
  lines: JournalLine[];
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
  currency: Currency;
  exchangeRate: number;
}

export interface FiscalPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: FiscalPeriodStatus;
}

export interface Budget extends AuditFields {
  id: string;
  name: string;
  fiscalYear: number;
  status: "draft" | "approved" | "active" | "closed";
  totalAmount: Money;
  lines: BudgetLine[];
}

export interface BudgetLine {
  id: string;
  accountId: string;
  accountName: string;
  period: string;
  budgetedAmount: Money;
  actualAmount: Money;
  variance: Money;
}
