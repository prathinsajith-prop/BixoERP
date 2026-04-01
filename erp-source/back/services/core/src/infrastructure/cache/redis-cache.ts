import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CachePort } from '../../application/port/cache.port';

@Injectable()
export class RedisCache implements CachePort, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCache.name);
  private client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis({
      host: this.config.get<string>('redis.host'),
      port: this.config.get<number>('redis.port'),
      keyPrefix: 'auth:',
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
      retryStrategy: (times) => Math.min(times * 200, 3000),
      reconnectOnError: () => true,
    });

    this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
    this.client.on('reconnecting', () => this.logger.warn('Redis reconnecting…'));
  }

  async onModuleInit(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      if (this.client.status === 'ready') { this.logger.log('Redis connected'); resolve(); return; }
      this.client.once('ready', () => { this.logger.log('Redis connected'); resolve(); });
      this.client.once('error', reject);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
