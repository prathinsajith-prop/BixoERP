import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot, DomainEvent } from './aggregate-root.base';
import { Money } from '../value-objects/money';

export enum JournalEntryStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
}

export interface JournalLineProps {
  id: string;
  accountId: string;
  description: string;
  debit: Money;
  credit: Money;
  currency: string;
  exchangeRate: number;
  baseCurrencyDebit: Money;
  baseCurrencyCredit: Money;
}

export interface JournalEntryProps {
  entryNumber: string;
  date: Date;
  description: string;
  status: JournalEntryStatus;
  lines: JournalLineProps[];
  tenantId: string;
  fiscalYear: number;
  fiscalMonth: number;
  reversalOfId: string | null;
  createdBy: string;
  postedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class JournalEntry extends AggregateRoot<JournalEntryProps> {
  static create(
    props: {
      entryNumber: string;
      date: Date;
      description: string;
      lines: JournalLineProps[];
      tenantId: string;
      fiscalYear: number;
      fiscalMonth: number;
      createdBy: string;
    },
    id?: string,
  ): JournalEntry {
    const entry = new JournalEntry(
      {
        ...props,
        status: JournalEntryStatus.DRAFT,
        reversalOfId: null,
        postedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id ?? uuidv4(),
    );

    // Invariant: debits must equal credits
    entry.validateDoubleEntry();

    return entry;
  }

  static fromPersistence(props: JournalEntryProps, id: string): JournalEntry {
    return new JournalEntry(props, id);
  }

  get entryNumber(): string {
    return this.props.entryNumber;
  }

  get date(): Date {
    return this.props.date;
  }

  get description(): string {
    return this.props.description;
  }

  get status(): JournalEntryStatus {
    return this.props.status;
  }

  get lines(): ReadonlyArray<JournalLineProps> {
    return this.props.lines;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get fiscalYear(): number {
    return this.props.fiscalYear;
  }

  get fiscalMonth(): number {
    return this.props.fiscalMonth;
  }

  get reversalOfId(): string | null {
    return this.props.reversalOfId;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get postedAt(): Date | null {
    return this.props.postedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isDraft(): boolean {
    return this.props.status === JournalEntryStatus.DRAFT;
  }

  get isPosted(): boolean {
    return this.props.status === JournalEntryStatus.POSTED;
  }

  /** INVARIANT: Sum of debits MUST equal sum of credits (double-entry) */
  private validateDoubleEntry(): void {
    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of this.props.lines) {
      totalDebits += line.baseCurrencyDebit.amountAsNumber;
      totalCredits += line.baseCurrencyCredit.amountAsNumber;
    }

    // Compare with tolerance for floating point (4 decimal places)
    if (Math.abs(totalDebits - totalCredits) > 0.0001) {
      throw new JournalEntryImbalanceError(totalDebits, totalCredits);
    }
  }

  /** Post the journal entry — makes it immutable */
  post(): void {
    if (this.props.status !== JournalEntryStatus.DRAFT) {
      throw new Error(`Cannot post entry in status: ${this.props.status}`);
    }

    this.validateDoubleEntry();
    this.props.status = JournalEntryStatus.POSTED;
    this.props.postedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'journal.entry.posted',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        entryNumber: this.props.entryNumber,
        date: this.props.date.toISOString(),
        lineCount: this.props.lines.length,
      },
    });
  }

  /** Create a reversal entry — posted entries are immutable, so we reverse */
  createReversal(entryNumber: string, createdBy: string): JournalEntry {
    if (this.props.status !== JournalEntryStatus.POSTED) {
      throw new Error('Can only reverse a posted entry');
    }

    const reversedLines: JournalLineProps[] = this.props.lines.map((line) => ({
      ...line,
      id: uuidv4(),
      debit: line.credit,
      credit: line.debit,
      baseCurrencyDebit: line.baseCurrencyCredit,
      baseCurrencyCredit: line.baseCurrencyDebit,
    }));

    const reversalId = uuidv4();
    const reversal = new JournalEntry(
      {
        entryNumber,
        date: new Date(),
        description: `Reversal of ${this.props.entryNumber}: ${this.props.description}`,
        status: JournalEntryStatus.DRAFT,
        lines: reversedLines,
        tenantId: this.props.tenantId,
        fiscalYear: this.props.fiscalYear,
        fiscalMonth: this.props.fiscalMonth,
        reversalOfId: this._id,
        createdBy,
        postedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      reversalId,
    );

    this.props.status = JournalEntryStatus.REVERSED;
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'journal.entry.reversed',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: new Date(),
      payload: {
        originalEntryNumber: this.props.entryNumber,
        reversalEntryId: reversalId,
        reversalEntryNumber: entryNumber,
      },
    });

    return reversal;
  }

  get totalDebits(): Money {
    return this.props.lines.reduce(
      (sum, line) => sum.add(line.baseCurrencyDebit),
      Money.zero('USD'),
    );
  }

  get totalCredits(): Money {
    return this.props.lines.reduce(
      (sum, line) => sum.add(line.baseCurrencyCredit),
      Money.zero('USD'),
    );
  }
}

export class JournalEntryImbalanceError extends Error {
  constructor(totalDebits: number, totalCredits: number) {
    super(
      `Double-entry violation: total debits (${totalDebits.toFixed(4)}) ≠ total credits (${totalCredits.toFixed(4)})`,
    );
    this.name = 'JournalEntryImbalanceError';
  }
}
