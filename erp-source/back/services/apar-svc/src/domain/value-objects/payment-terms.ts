/**
 * Value Object: PaymentTerms
 * Encodes payment terms like Net 30, Net 60, 2/10 Net 30
 * (2% discount if paid within 10 days, otherwise due in 30 days)
 */
export class PaymentTerms {
  private constructor(
    private readonly _code: string,
    private readonly _netDays: number,
    private readonly _discountPercent: number,
    private readonly _discountDays: number,
  ) {}

  /** Create standard net terms: Net 30, Net 60, etc. */
  static net(days: number): PaymentTerms {
    if (days < 0 || days > 365) {
      throw new Error(`Invalid net days: ${days}`);
    }
    return new PaymentTerms(`Net ${days}`, days, 0, 0);
  }

  /** Create early-payment discount terms: e.g. 2/10 Net 30 */
  static withDiscount(discountPercent: number, discountDays: number, netDays: number): PaymentTerms {
    if (discountPercent < 0 || discountPercent > 100) {
      throw new Error(`Invalid discount percent: ${discountPercent}`);
    }
    if (discountDays >= netDays) {
      throw new Error('Discount days must be less than net days');
    }
    return new PaymentTerms(
      `${discountPercent}/${discountDays} Net ${netDays}`,
      netDays,
      discountPercent,
      discountDays,
    );
  }

  static fromCode(code: string): PaymentTerms {
    // Parse "2/10 Net 30" style
    const discountMatch = code.match(/^(\d+(?:\.\d+)?)\/(\d+)\s+Net\s+(\d+)$/i);
    if (discountMatch) {
      return PaymentTerms.withDiscount(
        parseFloat(discountMatch[1]),
        parseInt(discountMatch[2], 10),
        parseInt(discountMatch[3], 10),
      );
    }
    // Parse "Net 30" style
    const netMatch = code.match(/^Net\s+(\d+)$/i);
    if (netMatch) {
      return PaymentTerms.net(parseInt(netMatch[1], 10));
    }
    throw new Error(`Unrecognized payment terms code: ${code}`);
  }

  get code(): string {
    return this._code;
  }

  get netDays(): number {
    return this._netDays;
  }

  get discountPercent(): number {
    return this._discountPercent;
  }

  get discountDays(): number {
    return this._discountDays;
  }

  get hasDiscount(): boolean {
    return this._discountPercent > 0;
  }

  /** Calculate the due date given an invoice date */
  calculateDueDate(invoiceDate: Date): Date {
    const due = new Date(invoiceDate);
    due.setDate(due.getDate() + this._netDays);
    return due;
  }

  /** Calculate the discount deadline date */
  calculateDiscountDeadline(invoiceDate: Date): Date | null {
    if (!this.hasDiscount) return null;
    const deadline = new Date(invoiceDate);
    deadline.setDate(deadline.getDate() + this._discountDays);
    return deadline;
  }

  /** Is the payment eligible for the early discount? */
  isEligibleForDiscount(paymentDate: Date, invoiceDate: Date): boolean {
    if (!this.hasDiscount) return false;
    const deadline = this.calculateDiscountDeadline(invoiceDate)!;
    return paymentDate <= deadline;
  }

  equals(other: PaymentTerms): boolean {
    return this._code === other._code;
  }
}
