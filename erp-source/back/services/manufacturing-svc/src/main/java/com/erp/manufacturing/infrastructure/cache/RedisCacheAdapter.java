package com.erp.manufacturing.infrastructure.cache;

import com.erp.manufacturing.application.port.CachePort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class RedisCacheAdapter implements CachePort {

    private static final String KEY_PREFIX = "manufacturing:";

    private final StringRedisTemplate redisTemplate;

    @Override
    public void put(String key, String value, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(KEY_PREFIX + key, value, ttl);
        } catch (Exception e) {
            log.warn("Redis cache put failed for key {}: {}", key, e.getMessage());
        }
    }

    @Override
    public Optional<String> get(String key) {
        try {
            String value = redisTemplate.opsForValue().get(KEY_PREFIX + key);
            return Optional.ofNullable(value);
        } catch (Exception e) {
            log.warn("Redis cache get failed for key {}: {}", key, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public void evict(String key) {
        try {
            redisTemplate.delete(KEY_PREFIX + key);
        } catch (Exception e) {
            log.warn("Redis cache evict failed for key {}: {}", key, e.getMessage());
        }
    }
}
