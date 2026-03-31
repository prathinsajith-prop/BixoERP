export class ExchangeRate {
  private constructor(
    private readonly _fromCurrency: string,
    private readonly _toCurrency: string,
    private readonly _rate: string,
    private readonly _effectiveDate: Date,
  ) {}

  static create(
    fromCurrency: string,
    toCurrency: string,
    rate: number | string,
    effectiveDate: Date,
  ): ExchangeRate {
    const parsed = typeof rate === 'string' ? parseFloat(rate) : rate;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(`Invalid exchange rate: ${rate}`);
    }
    return new ExchangeRate(
      fromCurrency.toUpperCase(),
      toCurrency.toUpperCase(),
      parsed.toFixed(6),
      effectiveDate,
    );
  }

  get fromCurrency(): string {
    return this._fromCurrency;
  }

  get toCurrency(): string {
    return this._toCurrency;
  }

  get rate(): number {
    return parseFloat(this._rate);
  }

  get effectiveDate(): Date {
    return this._effectiveDate;
  }

  convert(amount: number): number {
    return parseFloat((amount * this.rate).toFixed(4));
  }

  inverse(): ExchangeRate {
    return ExchangeRate.create(
      this._toCurrency,
      this._fromCurrency,
      1 / this.rate,
      this._effectiveDate,
    );
  }

  equals(other: ExchangeRate): boolean {
    return (
      this._fromCurrency === other._fromCurrency &&
      this._toCurrency === other._toCurrency &&
      this._rate === other._rate
    );
  }
}
