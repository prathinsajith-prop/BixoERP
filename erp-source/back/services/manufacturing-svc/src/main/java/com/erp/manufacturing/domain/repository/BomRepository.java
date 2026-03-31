package com.erp.manufacturing.domain.repository;

import com.erp.manufacturing.domain.entity.BillOfMaterials;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BomRepository {

    BillOfMaterials save(BillOfMaterials bom);

    Optional<BillOfMaterials> findById(UUID id, UUID tenantId);

    Optional<BillOfMaterials> findByBomNumber(String bomNumber, UUID tenantId);

    Optional<BillOfMaterials> findActiveByProductId(UUID productId, UUID tenantId);

    List<BillOfMaterials> findByTenantId(UUID tenantId, int page, int size);

    long countByTenantId(UUID tenantId);
}
