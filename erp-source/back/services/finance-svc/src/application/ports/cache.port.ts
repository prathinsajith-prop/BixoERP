/** Port for caching — implemented by Redis in infrastructure */
export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delByPattern(pattern: string): Promise<void>;
}

export const CACHE_PORT = Symbol('CachePort');
