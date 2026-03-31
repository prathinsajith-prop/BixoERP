export class TaxRule {
  private constructor(
    private readonly _taxCode: string,
    private readonly _name: string,
    private readonly _rate: string,
    private readonly _jurisdiction: string,
    private readonly _type: TaxType,
    private readonly _isActive: boolean,
  ) {}

  static create(
    taxCode: string,
    name: string,
    rate: number,
    jurisdiction: string,
    type: TaxType,
  ): TaxRule {
    if (rate < 0 || rate > 100) {
      throw new Error(`Invalid tax rate: ${rate}. Must be 0-100.`);
    }
    return new TaxRule(taxCode, name, rate.toFixed(4), jurisdiction, type, true);
  }

  get taxCode(): string {
    return this._taxCode;
  }

  get name(): string {
    return this._name;
  }

  get rate(): number {
    return parseFloat(this._rate);
  }

  get jurisdiction(): string {
    return this._jurisdiction;
  }

  get type(): TaxType {
    return this._type;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  calculateTax(amount: number): number {
    return parseFloat(((amount * this.rate) / 100).toFixed(4));
  }

  equals(other: TaxRule): boolean {
    return this._taxCode === other._taxCode;
  }
}

export enum TaxType {
  VAT = 'VAT',
  GST = 'GST',
  SALES_TAX = 'SALES_TAX',
  INPUT_TAX = 'INPUT_TAX',
  OUTPUT_TAX = 'OUTPUT_TAX',
}
