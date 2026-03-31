import { FiscalPeriod, FiscalPeriodStatus } from '../value-objects/fiscal-period';

/**
 * Domain service: enforces period closure business rules.
 * Pure logic — no infrastructure imports.
 */
export class PeriodClosurePolicy {
  /** Check if posting to a period is allowed */
  static canPostTo(period: FiscalPeriod): PolicyResult {
    if (period.isClosed) {
      return {
        allowed: false,
        reason: `Period ${period.label} is hard-closed. No entries allowed.`,
      };
    }

    if (period.status === FiscalPeriodStatus.SOFT_CLOSED) {
      return {
        allowed: false,
        reason: `Period ${period.label} is soft-closed. Reopen it first or post to an open period.`,
      };
    }

    return { allowed: true };
  }

  /** Pre-conditions for soft-closing a period */
  static canSoftClose(
    period: FiscalPeriod,
    hasUnpostedDrafts: boolean,
  ): PolicyResult {
    if (!period.isOpen) {
      return {
        allowed: false,
        reason: `Period ${period.label} is not open (current status: ${period.status})`,
      };
    }

    if (hasUnpostedDrafts) {
      return {
        allowed: false,
        reason: `Period ${period.label} has unposted draft entries. Post or delete them before closing.`,
      };
    }

    return { allowed: true };
  }

  /** Pre-conditions for hard-closing a period */
  static canHardClose(
    period: FiscalPeriod,
    allReconciled: boolean,
  ): PolicyResult {
    if (period.status !== FiscalPeriodStatus.SOFT_CLOSED) {
      return {
        allowed: false,
        reason: `Period ${period.label} must be soft-closed before hard-closing (current: ${period.status})`,
      };
    }

    if (!allReconciled) {
      return {
        allowed: false,
        reason: `Period ${period.label} has unreconciled accounts. Reconcile all accounts before hard-closing.`,
      };
    }

    return { allowed: true };
  }
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}
