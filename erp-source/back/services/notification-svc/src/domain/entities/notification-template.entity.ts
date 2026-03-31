import { v4 as uuidv4 } from 'uuid';
import { NotificationChannel } from '../value-objects/notification-channel.vo';

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: string;
}

export interface NotificationTemplateProps {
  tenantId: string;
  name: string;
  code: string;
  channel: NotificationChannel;
  subjectTemplate: string;
  bodyTemplate: string;
  variables: TemplateVariable[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationTemplate {
  private readonly _id: string;
  private props: NotificationTemplateProps;

  constructor(props: NotificationTemplateProps, id: string) {
    this._id = id;
    this.props = props;
  }

  get id(): string { return this._id; }
  get tenantId(): string { return this.props.tenantId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get channel(): NotificationChannel { return this.props.channel; }
  get subjectTemplate(): string { return this.props.subjectTemplate; }
  get bodyTemplate(): string { return this.props.bodyTemplate; }
  get variables(): TemplateVariable[] { return this.props.variables; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  static create(params: {
    tenantId: string;
    name: string;
    code: string;
    channel: NotificationChannel;
    subjectTemplate: string;
    bodyTemplate: string;
    variables: TemplateVariable[];
  }): NotificationTemplate {
    const now = new Date();
    return new NotificationTemplate(
      {
        tenantId: params.tenantId,
        name: params.name,
        code: params.code,
        channel: params.channel,
        subjectTemplate: params.subjectTemplate,
        bodyTemplate: params.bodyTemplate,
        variables: params.variables,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      uuidv4(),
    );
  }

  update(params: Partial<Pick<NotificationTemplateProps, 'name' | 'subjectTemplate' | 'bodyTemplate' | 'variables' | 'isActive'>>): void {
    if (params.name !== undefined) this.props.name = params.name;
    if (params.subjectTemplate !== undefined) this.props.subjectTemplate = params.subjectTemplate;
    if (params.bodyTemplate !== undefined) this.props.bodyTemplate = params.bodyTemplate;
    if (params.variables !== undefined) this.props.variables = params.variables;
    if (params.isActive !== undefined) this.props.isActive = params.isActive;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  static reconstitute(id: string, props: NotificationTemplateProps): NotificationTemplate {
    return new NotificationTemplate(props, id);
  }
}
