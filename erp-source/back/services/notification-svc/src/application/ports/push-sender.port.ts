export interface PushSender {
  send(params: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export const PUSH_SENDER = Symbol('PushSender');
