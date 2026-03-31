/** Value Object: Money — always stores amount + currency */
export class Money {
  private constructor(
    private readonly _amount: string,
    private readonly _currency: string,
  ) {}

  static create(amount: number | string, currency: string): Money {
    const parsed =
      typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!Number.isFinite(parsed)) {
      throw new Error(`Invalid money amount: ${amount}`);
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error(`Invalid ISO currency code: ${currency}`);
    }
    return new Money(parsed.toFixed(4), currency.toUpperCase());
  }

  static zero(currency: string): Money {
    return Money.create(0, currency);
  }

  get amount(): string {
    return this._amount;
  }

  get amountAsNumber(): number {
    return parseFloat(this._amount);
  }

  get currency(): string {
    return this._currency;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    const sum = this.amountAsNumber + other.amountAsNumber;
    return Money.create(sum, this._currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const diff = this.amountAsNumber - other.amountAsNumber;
    return Money.create(diff, this._currency);
  }

  multiply(factor: number): Money {
    return Money.create(this.amountAsNumber * factor, this._currency);
  }

  negate(): Money {
    return Money.create(-this.amountAsNumber, this._currency);
  }

  isZero(): boolean {
    return this.amountAsNumber === 0;
  }

  isPositive(): boolean {
    return this.amountAsNumber > 0;
  }

  isNegative(): boolean {
    return this.amountAsNumber < 0;
  }

  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amountAsNumber > other.amountAsNumber;
  }

  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(
        `Currency mismatch: cannot operate on ${this._currency} and ${other._currency}`,
      );
    }
  }

  toString(): string {
    return `${this._amount} ${this._currency}`;
  }
}
