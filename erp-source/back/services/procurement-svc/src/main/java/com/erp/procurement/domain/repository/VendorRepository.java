package com.erp.procurement.domain.repository;

import com.erp.procurement.domain.entity.Vendor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VendorRepository {

    Vendor save(Vendor vendor);

    Optional<Vendor> findById(UUID id, UUID tenantId);

    Optional<Vendor> findByCode(String code, UUID tenantId);

    List<Vendor> findByTenantId(UUID tenantId, int page, int size);

    long countByTenantId(UUID tenantId);
}
