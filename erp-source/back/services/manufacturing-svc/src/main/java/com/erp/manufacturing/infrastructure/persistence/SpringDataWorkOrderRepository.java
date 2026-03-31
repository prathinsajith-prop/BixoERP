package com.erp.manufacturing.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataWorkOrderRepository extends JpaRepository<WorkOrderJpaEntity, UUID> {

    Optional<WorkOrderJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<WorkOrderJpaEntity> findByOrderNumberAndTenantId(String orderNumber, UUID tenantId);

    Page<WorkOrderJpaEntity> findByTenantId(UUID tenantId, Pageable pageable);

    List<WorkOrderJpaEntity> findByTenantIdAndStatus(UUID tenantId, String status);

    List<WorkOrderJpaEntity> findByBomIdAndTenantId(UUID bomId, UUID tenantId);

    long countByTenantId(UUID tenantId);
}
