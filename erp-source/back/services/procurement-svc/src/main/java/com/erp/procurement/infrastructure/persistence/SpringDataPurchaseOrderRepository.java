package com.erp.procurement.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataPurchaseOrderRepository extends JpaRepository<PurchaseOrderJpaEntity, UUID> {

    Optional<PurchaseOrderJpaEntity> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<PurchaseOrderJpaEntity> findByOrderNumberAndTenantId(String orderNumber, UUID tenantId);

    Page<PurchaseOrderJpaEntity> findByTenantId(UUID tenantId, Pageable pageable);

    List<PurchaseOrderJpaEntity> findByVendorIdAndTenantId(UUID vendorId, UUID tenantId);

    long countByTenantId(UUID tenantId);
}
