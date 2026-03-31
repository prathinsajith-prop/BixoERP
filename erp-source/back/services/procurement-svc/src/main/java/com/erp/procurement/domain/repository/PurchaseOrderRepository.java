package com.erp.procurement.domain.repository;

import com.erp.procurement.domain.entity.PurchaseOrder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PurchaseOrderRepository {

    PurchaseOrder save(PurchaseOrder order);

    Optional<PurchaseOrder> findById(UUID id, UUID tenantId);

    Optional<PurchaseOrder> findByOrderNumber(String orderNumber, UUID tenantId);

    List<PurchaseOrder> findByTenantId(UUID tenantId, int page, int size);

    List<PurchaseOrder> findByVendorId(UUID vendorId, UUID tenantId);

    long countByTenantId(UUID tenantId);
}
