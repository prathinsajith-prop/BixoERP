import { Entity } from './entity.base';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum NormalBalance {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export interface AccountProps {
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  parentId: string | null;
  groupId: string | null;
  isActive: boolean;
  tenantId: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Account extends Entity<AccountProps> {
  static create(props: Omit<AccountProps, 'isActive' | 'createdAt' | 'updatedAt'>, id?: string): Account {
    return new Account(
      {
        ...props,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  static fromPersistence(props: AccountProps, id: string): Account {
    return new Account(props, id);
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get type(): AccountType {
    return this.props.type;
  }

  get normalBalance(): NormalBalance {
    return this.props.normalBalance;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  get groupId(): string | null {
    return this.props.groupId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get description(): string | null {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  rename(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  /** Returns the normal balance direction for this account type */
  static normalBalanceFor(type: AccountType): NormalBalance {
    switch (type) {
      case AccountType.ASSET:
      case AccountType.EXPENSE:
        return NormalBalance.DEBIT;
      case AccountType.LIABILITY:
      case AccountType.EQUITY:
      case AccountType.REVENUE:
        return NormalBalance.CREDIT;
    }
  }
}
