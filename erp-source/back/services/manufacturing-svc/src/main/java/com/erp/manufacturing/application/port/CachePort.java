package com.erp.manufacturing.application.port;

import java.time.Duration;
import java.util.Optional;

public interface CachePort {

    void put(String key, String value, Duration ttl);

    Optional<String> get(String key);

    void evict(String key);
}
