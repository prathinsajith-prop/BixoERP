package com.erp.manufacturing.domain.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@AllArgsConstructor
public abstract class DomainEvent {

    private final UUID eventId;
    private final String eventType;
    private final UUID aggregateId;
    private final String aggregateType;
    private final UUID tenantId;
    private final Instant occurredAt;

    protected DomainEvent(String eventType, UUID aggregateId, String aggregateType, UUID tenantId) {
        this.eventId = UUID.randomUUID();
        this.eventType = eventType;
        this.aggregateId = aggregateId;
        this.aggregateType = aggregateType;
        this.tenantId = tenantId;
        this.occurredAt = Instant.now();
    }
}
