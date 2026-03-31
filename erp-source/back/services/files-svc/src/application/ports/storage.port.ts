import { Readable } from 'stream';

export interface StoragePort {
  upload(bucket: string, key: string, body: Buffer, contentType: string): Promise<void>;
  download(bucket: string, key: string): Promise<{ body: Readable; contentType: string }>;
  delete(bucket: string, key: string): Promise<void>;
  exists(bucket: string, key: string): Promise<boolean>;
  getPresignedUrl(bucket: string, key: string, expiresInSeconds?: number): Promise<string>;
}

export const STORAGE_PORT = Symbol('StoragePort');
