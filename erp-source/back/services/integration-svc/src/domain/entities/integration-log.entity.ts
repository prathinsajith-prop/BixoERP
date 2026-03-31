import { AggregateRoot } from './aggregate-root.base';
import { IntegrationStatus } from '../value-objects/integration-status.vo';
import { v4 as uuidv4 } from 'uuid';

export interface IntegrationLogProps {
  tenantId: string;
  subscriptionId?: string;
  eventType: string;
  direction: 'OUTBOUND' | 'INBOUND';
  url: string;
  method: string;
  requestHeaders?: Record<string, string>;
  requestBody?: Record<string, unknown>;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  status: IntegrationStatus;
  durationMs?: number;
  attempt: number;
  errorMessage?: string;
  createdAt: Date;
}

export class IntegrationLog extends AggregateRoot<IntegrationLogProps> {
  get tenantId(): string { return this.props.tenantId; }
  get subscriptionId(): string | undefined { return this.props.subscriptionId; }
  get eventType(): string { return this.props.eventType; }
  get direction(): 'OUTBOUND' | 'INBOUND' { return this.props.direction; }
  get url(): string { return this.props.url; }
  get method(): string { return this.props.method; }
  get requestHeaders(): Record<string, string> | undefined { return this.props.requestHeaders; }
  get requestBody(): Record<string, unknown> | undefined { return this.props.requestBody; }
  get responseStatus(): number | undefined { return this.props.responseStatus; }
  get responseHeaders(): Record<string, string> | undefined { return this.props.responseHeaders; }
  get responseBody(): string | undefined { return this.props.responseBody; }
  get status(): IntegrationStatus { return this.props.status; }
  get durationMs(): number | undefined { return this.props.durationMs; }
  get attempt(): number { return this.props.attempt; }
  get errorMessage(): string | undefined { return this.props.errorMessage; }
  get createdAt(): Date { return this.props.createdAt; }

  static create(params: {
    tenantId: string;
    subscriptionId?: string;
    eventType: string;
    direction: 'OUTBOUND' | 'INBOUND';
    url: string;
    method: string;
    requestHeaders?: Record<string, string>;
    requestBody?: Record<string, unknown>;
    attempt?: number;
  }): IntegrationLog {
    const id = uuidv4();
    return new IntegrationLog(
      {
        tenantId: params.tenantId,
        subscriptionId: params.subscriptionId,
        eventType: params.eventType,
        direction: params.direction,
        url: params.url,
        method: params.method,
        requestHeaders: params.requestHeaders,
        requestBody: params.requestBody,
        status: IntegrationStatus.PENDING,
        attempt: params.attempt ?? 1,
        createdAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(props: IntegrationLogProps, id: string): IntegrationLog {
    return new IntegrationLog(props, id);
  }

  recordSuccess(response: {
    status: number;
    headers?: Record<string, string>;
    body?: string;
    durationMs: number;
  }): void {
    this.props.responseStatus = response.status;
    this.props.responseHeaders = response.headers;
    this.props.responseBody = response.body;
    this.props.durationMs = response.durationMs;
    this.props.status = IntegrationStatus.SUCCESS;
  }

  recordFailure(error: {
    status?: number;
    headers?: Record<string, string>;
    body?: string;
    durationMs?: number;
    errorMessage: string;
  }): void {
    this.props.responseStatus = error.status;
    this.props.responseHeaders = error.headers;
    this.props.responseBody = error.body;
    this.props.durationMs = error.durationMs;
    this.props.errorMessage = error.errorMessage;
    this.props.status = IntegrationStatus.FAILED;
  }

  markRetrying(): void {
    this.props.status = IntegrationStatus.RETRYING;
  }
}
