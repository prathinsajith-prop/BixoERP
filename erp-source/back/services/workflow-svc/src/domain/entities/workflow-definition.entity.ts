import { v4 as uuidv4 } from 'uuid';
import { WorkflowStepType } from '../value-objects/workflow-step-type';

export interface WorkflowStepDefinition {
  stepOrder: number;
  name: string;
  stepType: WorkflowStepType;
  approverUserIds: string[];
  approverRoleIds: string[];
  autoEscalateAfterHours: number | null;
  conditions: Record<string, unknown> | null;
}

export interface WorkflowDefinitionProps {
  code: string;
  name: string;
  description: string | null;
  entityType: string;
  tenantId: string;
  steps: WorkflowStepDefinition[];
  isActive: boolean;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkflowDefinition {
  private readonly _id: string;
  private props: WorkflowDefinitionProps;

  constructor(props: WorkflowDefinitionProps, id: string) {
    this._id = id;
    this.props = props;
  }

  get id(): string { return this._id; }
  get code(): string { return this.props.code; }
  get name(): string { return this.props.name; }
  get description(): string | null { return this.props.description; }
  get entityType(): string { return this.props.entityType; }
  get tenantId(): string { return this.props.tenantId; }
  get steps(): ReadonlyArray<WorkflowStepDefinition> { return this.props.steps; }
  get isActive(): boolean { return this.props.isActive; }
  get version(): number { return this.props.version; }
  get createdBy(): string { return this.props.createdBy; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  static create(params: {
    code: string;
    name: string;
    description: string | null;
    entityType: string;
    steps: WorkflowStepDefinition[];
    tenantId: string;
    createdBy: string;
  }): WorkflowDefinition {
    const id = uuidv4();
    const now = new Date();
    return new WorkflowDefinition(
      {
        code: params.code,
        name: params.name,
        description: params.description,
        entityType: params.entityType,
        tenantId: params.tenantId,
        steps: params.steps,
        isActive: true,
        version: 1,
        createdBy: params.createdBy,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  static reconstitute(id: string, props: WorkflowDefinitionProps): WorkflowDefinition {
    return new WorkflowDefinition(props, id);
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  getStepByOrder(order: number): WorkflowStepDefinition | undefined {
    return this.props.steps.find((s) => s.stepOrder === order);
  }

  get totalSteps(): number {
    return this.props.steps.length;
  }
}
