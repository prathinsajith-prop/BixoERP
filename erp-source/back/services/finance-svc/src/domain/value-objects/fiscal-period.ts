export enum FiscalPeriodStatus {
  OPEN = 'OPEN',
  SOFT_CLOSED = 'SOFT_CLOSED',
  HARD_CLOSED = 'HARD_CLOSED',
}

export class FiscalPeriod {
  private constructor(
    private readonly _year: number,
    private readonly _month: number,
    private _status: FiscalPeriodStatus,
    private readonly _startDate: Date,
    private readonly _endDate: Date,
  ) {}

  static create(
    year: number,
    month: number,
    startDate: Date,
    endDate: Date,
  ): FiscalPeriod {
    if (month < 1 || month > 12) {
      throw new Error(`Invalid fiscal month: ${month}`);
    }
    return new FiscalPeriod(year, month, FiscalPeriodStatus.OPEN, startDate, endDate);
  }

  static fromPersistence(
    year: number,
    month: number,
    status: FiscalPeriodStatus,
    startDate: Date,
    endDate: Date,
  ): FiscalPeriod {
    return new FiscalPeriod(year, month, status, startDate, endDate);
  }

  get year(): number {
    return this._year;
  }

  get month(): number {
    return this._month;
  }

  get status(): FiscalPeriodStatus {
    return this._status;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get endDate(): Date {
    return this._endDate;
  }

  get isOpen(): boolean {
    return this._status === FiscalPeriodStatus.OPEN;
  }

  get isClosed(): boolean {
    return this._status === FiscalPeriodStatus.HARD_CLOSED;
  }

  softClose(): void {
    if (this._status !== FiscalPeriodStatus.OPEN) {
      throw new Error(`Cannot soft-close period in status: ${this._status}`);
    }
    this._status = FiscalPeriodStatus.SOFT_CLOSED;
  }

  hardClose(): void {
    if (this._status !== FiscalPeriodStatus.SOFT_CLOSED) {
      throw new Error(`Cannot hard-close period in status: ${this._status}. Must soft-close first.`);
    }
    this._status = FiscalPeriodStatus.HARD_CLOSED;
  }

  reopen(): void {
    if (this._status !== FiscalPeriodStatus.SOFT_CLOSED) {
      throw new Error(`Cannot reopen period in status: ${this._status}`);
    }
    this._status = FiscalPeriodStatus.OPEN;
  }

  containsDate(date: Date): boolean {
    return date >= this._startDate && date <= this._endDate;
  }

  get label(): string {
    return `${this._year}-${String(this._month).padStart(2, '0')}`;
  }

  equals(other: FiscalPeriod): boolean {
    return this._year === other._year && this._month === other._month;
  }
}
