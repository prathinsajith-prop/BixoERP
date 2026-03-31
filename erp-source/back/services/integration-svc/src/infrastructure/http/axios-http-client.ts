import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { HttpClient, HttpClientRequest, HttpClientResponse } from '../../application/ports/http-client.port';

@Injectable()
export class AxiosHttpClient implements HttpClient {
  private readonly logger = new Logger(AxiosHttpClient.name);

  async request(req: HttpClientRequest): Promise<HttpClientResponse> {
    const start = Date.now();

    try {
      const response = await axios({
        url: req.url,
        method: req.method,
        headers: req.headers,
        data: req.body,
        timeout: req.timeoutMs || 10_000,
        validateStatus: () => true, // Don't throw on non-2xx
        maxRedirects: 5,
      });

      const durationMs = Date.now() - start;

      const responseHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(response.headers)) {
        if (typeof value === 'string') {
          responseHeaders[key] = value;
        }
      }

      return {
        status: response.status,
        headers: responseHeaders,
        body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        durationMs,
      };
    } catch (error: unknown) {
      const durationMs = Date.now() - start;

      if (error instanceof AxiosError) {
        if (error.response) {
          const responseHeaders: Record<string, string> = {};
          for (const [key, value] of Object.entries(error.response.headers)) {
            if (typeof value === 'string') {
              responseHeaders[key] = value;
            }
          }

          return {
            status: error.response.status,
            headers: responseHeaders,
            body: typeof error.response.data === 'string'
              ? error.response.data
              : JSON.stringify(error.response.data),
            durationMs,
          };
        }

        this.logger.warn(`HTTP request failed: ${error.message}`);
        throw new Error(`HTTP request failed: ${error.message}`);
      }

      throw error;
    }
  }
}
