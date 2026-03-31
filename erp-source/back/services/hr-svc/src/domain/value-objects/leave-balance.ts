import { BusinessRuleViolation } from '../exceptions/domain.exceptions';
import { LeaveType } from '../entities/leave-request.entity';

/** Value Object: tracks remaining leave balance per leave type */
export class LeaveBalance {
  private constructor(
    private readonly _employeeId: string,
    private readonly _leaveType: LeaveType,
    private readonly _year: number,
    private _entitled: number,
    private _used: number,
    private _pending: number,
  ) {}

  static create(
    employeeId: string,
    leaveType: LeaveType,
    year: number,
    entitled: number,
  ): LeaveBalance {
    if (entitled < 0) {
      throw new Error(`Entitled days cannot be negative: ${entitled}`);
    }
    return new LeaveBalance(employeeId, leaveType, year, entitled, 0, 0);
  }

  static fromPersistence(
    employeeId: string,
    leaveType: LeaveType,
    year: number,
    entitled: number,
    used: number,
    pending: number,
  ): LeaveBalance {
    return new LeaveBalance(employeeId, leaveType, year, entitled, used, pending);
  }

  get employeeId(): string {
    return this._employeeId;
  }

  get leaveType(): LeaveType {
    return this._leaveType;
  }

  get year(): number {
    return this._year;
  }

  get entitled(): number {
    return this._entitled;
  }

  get used(): number {
    return this._used;
  }

  get pending(): number {
    return this._pending;
  }

  get remaining(): number {
    return this._entitled - this._used - this._pending;
  }

  /** Invariant: Leave balance cannot go negative */
  deductPending(days: number): void {
    if (this.remaining < days) {
      throw new BusinessRuleViolation(
        `Insufficient leave balance for ${this._leaveType}: available=${this.remaining}, requested=${days}`,
      );
    }
    this._pending += days;
  }

  confirmUsed(days: number): void {
    this._pending -= days;
    this._used += days;
  }

  cancelPending(days: number): void {
    this._pending -= days;
  }

  equals(other: LeaveBalance): boolean {
    return (
      this._employeeId === other._employeeId &&
      this._leaveType === other._leaveType &&
      this._year === other._year
    );
  }
}
