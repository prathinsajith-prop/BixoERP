package com.erp.procurement.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface SpringDataOutboxRepository extends JpaRepository<OutboxEventJpaEntity, UUID> {

    @Query("SELECT e FROM OutboxEventJpaEntity e WHERE e.publishedAt IS NULL ORDER BY e.createdAt ASC LIMIT :batchSize")
    List<OutboxEventJpaEntity> findUnpublished(int batchSize);
}
