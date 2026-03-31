export interface HttpClientResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
}

export interface HttpClientRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  timeoutMs?: number;
}

export interface HttpClient {
  request(req: HttpClientRequest): Promise<HttpClientResponse>;
}

export const HTTP_CLIENT = Symbol('HttpClient');
