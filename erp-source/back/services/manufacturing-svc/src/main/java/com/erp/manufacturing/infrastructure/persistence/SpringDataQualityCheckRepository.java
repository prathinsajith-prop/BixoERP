package com.erp.manufacturing.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SpringDataQualityCheckRepository extends JpaRepository<QualityCheckJpaEntity, UUID> {

    List<QualityCheckJpaEntity> findByWorkOrderId(UUID workOrderId);

    List<QualityCheckJpaEntity> findByWorkOrderIdAndResult(UUID workOrderId, String result);

    List<QualityCheckJpaEntity> findByTenantId(UUID tenantId);

    long countByTenantId(UUID tenantId);
}
