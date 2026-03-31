from __future__ import annotations

import logging

import redis.asyncio as redis

from app.config import settings

logger = logging.getLogger(__name__)


class RedisCache:
    """Async Redis cache for dashboard queries."""

    def __init__(self) -> None:
        self._redis: redis.Redis | None = None

    async def connect(self) -> None:
        self._redis = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            decode_responses=True,
        )
        logger.info("Connected to Redis at %s:%s", settings.redis_host, settings.redis_port)

    async def close(self) -> None:
        if self._redis:
            await self._redis.aclose()
            logger.info("Redis connection closed")

    async def get(self, key: str) -> str | None:
        if not self._redis:
            return None
        return await self._redis.get(key)

    async def set(self, key: str, value: str, ttl: int = 60) -> None:
        if not self._redis:
            return
        await self._redis.set(key, value, ex=ttl)

    async def delete(self, key: str) -> None:
        if not self._redis:
            return
        await self._redis.delete(key)

    async def delete_pattern(self, pattern: str) -> None:
        """Delete all keys matching a glob pattern."""
        if not self._redis:
            return
        cursor = 0
        while True:
            cursor, keys = await self._redis.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                await self._redis.delete(*keys)
            if cursor == 0:
                break


redis_cache = RedisCache()
