import { AggregateRoot } from './aggregate-root.base';
import { v4 as uuidv4 } from 'uuid';

export interface ExternalAdapterProps {
  tenantId: string;
  name: string;
  type: string;
  baseUrl: string;
  authType: 'API_KEY' | 'OAUTH2' | 'BASIC' | 'BEARER' | 'NONE';
  authConfig: Record<string, unknown>;
  headers?: Record<string, string>;
  enabled: boolean;
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ExternalAdapter extends AggregateRoot<ExternalAdapterProps> {
  get tenantId(): string { return this.props.tenantId; }
  get name(): string { return this.props.name; }
  get type(): string { return this.props.type; }
  get baseUrl(): string { return this.props.baseUrl; }
  get authType(): string { return this.props.authType; }
  get authConfig(): Record<string, unknown> { return this.props.authConfig; }
  get headers(): Record<string, string> | undefined { return this.props.headers; }
  get enabled(): boolean { return this.props.enabled; }
  get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
  get createdBy(): string { return this.props.createdBy; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  static create(params: {
    tenantId: string;
    name: string;
    type: string;
    baseUrl: string;
    authType: 'API_KEY' | 'OAUTH2' | 'BASIC' | 'BEARER' | 'NONE';
    authConfig: Record<string, unknown>;
    headers?: Record<string, string>;
    metadata?: Record<string, unknown>;
    createdBy: string;
  }): ExternalAdapter {
    const id = uuidv4();
    const now = new Date();
    return new ExternalAdapter(
      {
        tenantId: params.tenantId,
        name: params.name,
        type: params.type,
        baseUrl: params.baseUrl,
        authType: params.authType,
        authConfig: params.authConfig,
        headers: params.headers,
        enabled: true,
        metadata: params.metadata,
        createdBy: params.createdBy,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  static reconstitute(props: ExternalAdapterProps, id: string): ExternalAdapter {
    return new ExternalAdapter(props, id);
  }

  disable(): void {
    this.props.enabled = false;
    this.props.updatedAt = new Date();
  }

  enable(): void {
    this.props.enabled = true;
    this.props.updatedAt = new Date();
  }

  updateConfig(params: {
    name?: string;
    baseUrl?: string;
    authType?: 'API_KEY' | 'OAUTH2' | 'BASIC' | 'BEARER' | 'NONE';
    authConfig?: Record<string, unknown>;
    headers?: Record<string, string>;
    metadata?: Record<string, unknown>;
  }): void {
    if (params.name) this.props.name = params.name;
    if (params.baseUrl) this.props.baseUrl = params.baseUrl;
    if (params.authType) this.props.authType = params.authType;
    if (params.authConfig) this.props.authConfig = params.authConfig;
    if (params.headers !== undefined) this.props.headers = params.headers;
    if (params.metadata !== undefined) this.props.metadata = params.metadata;
    this.props.updatedAt = new Date();
  }
}
