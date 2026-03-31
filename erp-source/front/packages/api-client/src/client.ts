import type { PaginatedResponse, ApiError } from "@erp/shared";

export interface ApiClientConfig {
  baseUrl: string;
  getToken: () => Promise<string | null>;
}

export class ApiClient {
  private baseUrl: string;
  private getToken: () => Promise<string | null>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.getToken = config.getToken;
  }

  private async headers(): Promise<HeadersInit> {
    const token = await this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers: await this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        statusCode: response.status,
        message: response.statusText,
      }));
      throw error;
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  async list<T>(
    path: string,
    params?: { page?: number; pageSize?: number; search?: string; sort?: string; order?: "asc" | "desc" } & Record<string, string | number | boolean | undefined>
  ): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(path, params);
  }
}
