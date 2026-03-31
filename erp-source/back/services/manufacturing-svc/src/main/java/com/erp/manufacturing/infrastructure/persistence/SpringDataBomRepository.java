package com.erp.manufacturing.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataBomRepository extends JpaRepository<BomJpaEntity, UUID> {

    Optional<BomJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<BomJpaEntity> findByBomNumberAndTenantId(String bomNumber, UUID tenantId);

    Optional<BomJpaEntity> findByProductIdAndTenantIdAndActiveTrue(UUID productId, UUID tenantId);

    Page<BomJpaEntity> findByTenantId(UUID tenantId, Pageable pageable);

    long countByTenantId(UUID tenantId);
}
