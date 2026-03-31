import { v4 as uuidv4 } from 'uuid';

export interface DelegationRuleProps {
  fromUserId: string;
  toUserId: string;
  tenantId: string;
  entityType: string | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class DelegationRule {
  private readonly _id: string;
  private props: DelegationRuleProps;

  constructor(props: DelegationRuleProps, id: string) {
    this._id = id;
    this.props = props;
  }

  get id(): string { return this._id; }
  get fromUserId(): string { return this.props.fromUserId; }
  get toUserId(): string { return this.props.toUserId; }
  get tenantId(): string { return this.props.tenantId; }
  get entityType(): string | null { return this.props.entityType; }
  get startDate(): Date { return this.props.startDate; }
  get endDate(): Date { return this.props.endDate; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  static create(params: {
    fromUserId: string;
    toUserId: string;
    tenantId: string;
    entityType: string | null;
    startDate: Date;
    endDate: Date;
  }): DelegationRule {
    const id = uuidv4();
    const now = new Date();
    return new DelegationRule(
      {
        fromUserId: params.fromUserId,
        toUserId: params.toUserId,
        tenantId: params.tenantId,
        entityType: params.entityType,
        startDate: params.startDate,
        endDate: params.endDate,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  static reconstitute(id: string, props: DelegationRuleProps): DelegationRule {
    return new DelegationRule(props, id);
  }

  isEffective(atDate: Date = new Date()): boolean {
    return this.props.isActive && atDate >= this.props.startDate && atDate <= this.props.endDate;
  }

  appliesToEntityType(entityType: string): boolean {
    return this.props.entityType === null || this.props.entityType === entityType;
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }
}
