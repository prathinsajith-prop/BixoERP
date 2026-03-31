package com.erp.manufacturing.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataProcessedEventRepository extends JpaRepository<ProcessedEventJpaEntity, String> {
}
