import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StoragePort } from '../../application/ports/storage.port';
import { StorageException } from '../../domain/exceptions/domain.exceptions';

@Injectable()
export class S3StorageAdapter implements StoragePort, OnModuleInit {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private client!: S3Client;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.client = new S3Client({
      endpoint: this.config.get<string>('storage.endpoint'),
      region: this.config.get<string>('storage.region'),
      forcePathStyle: this.config.get<boolean>('storage.forcePathStyle'),
      credentials: {
        accessKeyId: this.config.get<string>('storage.accessKeyId')!,
        secretAccessKey: this.config.get<string>('storage.secretAccessKey')!,
      },
    });
    this.logger.log('S3 client initialized');

    const bucket = this.config.get<string>('storage.bucket')!;
    await this.ensureBucket(bucket);
  }

  private async ensureBucket(bucket: string): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      this.logger.log(`Bucket "${bucket}" not found, creating...`);
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
        this.logger.log(`Bucket "${bucket}" created`);
      } catch (err) {
        this.logger.warn(`Could not create bucket "${bucket}": ${err}`);
      }
    }
  }

  async upload(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    } catch (error) {
      this.logger.error(`S3 upload failed: ${error}`);
      throw new StorageException(`Failed to upload file to storage: ${key}`);
    }
  }

  async download(
    bucket: string,
    key: string,
  ): Promise<{ body: Readable; contentType: string }> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );

      return {
        body: response.Body as Readable,
        contentType: response.ContentType || 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error(`S3 download failed: ${error}`);
      throw new StorageException(`Failed to download file from storage: ${key}`);
    }
  }

  async delete(bucket: string, key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
    } catch (error) {
      this.logger.error(`S3 delete failed: ${error}`);
      throw new StorageException(`Failed to delete file from storage: ${key}`);
    }
  }

  async exists(bucket: string, key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async getPresignedUrl(
    bucket: string,
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      return await getSignedUrl(this.client, command, {
        expiresIn: expiresInSeconds,
      });
    } catch (error) {
      this.logger.error(`S3 presigned URL failed: ${error}`);
      throw new StorageException(`Failed to generate presigned URL: ${key}`);
    }
  }
}
