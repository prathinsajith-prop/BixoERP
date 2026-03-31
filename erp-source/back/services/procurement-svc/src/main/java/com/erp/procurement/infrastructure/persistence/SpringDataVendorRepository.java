package com.erp.procurement.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SpringDataVendorRepository extends JpaRepository<VendorJpaEntity, UUID> {

    Optional<VendorJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<VendorJpaEntity> findByCodeAndTenantId(String code, UUID tenantId);

    Page<VendorJpaEntity> findByTenantId(UUID tenantId, Pageable pageable);

    long countByTenantId(UUID tenantId);
}
