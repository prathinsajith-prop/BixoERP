import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CachePort } from '../../application/ports/cache.port';

@Injectable()
export class RedisCache implements CachePort, OnModuleInit, OnModuleDestroy {
  private client!: Redis;
  private prefix!: string;
  private defaultTtl!: number;

  constructor(private readonly config: ConfigService) { }

  async onModuleInit(): Promise<void> {
    this.prefix = this.config.get<string>('redis.keyPrefix') || 'hr:';
    this.defaultTtl = this.config.get<number>('redis.ttl') || 3600;
    this.client = new Redis({
      host: this.config.get<string>('redis.host'),
      port: this.config.get<number>('redis.port'),
      lazyConnect: true,
    });
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(`${this.prefix}${key}`);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTtl;
    await this.client.setex(`${this.prefix}${key}`, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.client.del(`${this.prefix}${key}`);
  }

  async delByPattern(pattern: string): Promise<void> {
    const fullPattern = `${this.prefix}${pattern}`;
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, batch] = await this.client.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}
