package com.erp.procurement.infrastructure.persistence;

import com.erp.procurement.domain.entity.Vendor;
import com.erp.procurement.domain.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class JpaVendorRepository implements VendorRepository {

    private final SpringDataVendorRepository jpaRepo;

    @Override
    public Vendor save(Vendor vendor) {
        VendorJpaEntity entity = toEntity(vendor);
        VendorJpaEntity saved = jpaRepo.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Vendor> findById(UUID id, UUID tenantId) {
        return jpaRepo.findByIdAndTenantId(id, tenantId).map(this::toDomain);
    }

    @Override
    public Optional<Vendor> findByCode(String code, UUID tenantId) {
        return jpaRepo.findByCodeAndTenantId(code, tenantId).map(this::toDomain);
    }

    @Override
    public List<Vendor> findByTenantId(UUID tenantId, int page, int size) {
        return jpaRepo.findByTenantId(tenantId,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name")))
                .map(this::toDomain)
                .getContent();
    }

    @Override
    public long countByTenantId(UUID tenantId) {
        return jpaRepo.countByTenantId(tenantId);
    }

    private VendorJpaEntity toEntity(Vendor v) {
        return VendorJpaEntity.builder()
                .id(v.getId())
                .tenantId(v.getTenantId())
                .code(v.getCode())
                .name(v.getName())
                .taxId(v.getTaxId())
                .email(v.getEmail())
                .phone(v.getPhone())
                .address(v.getAddress())
                .city(v.getCity())
                .country(v.getCountry())
                .paymentTerms(v.getPaymentTerms())
                .currency(v.getCurrency())
                .active(v.isActive())
                .createdAt(v.getCreatedAt())
                .updatedAt(v.getUpdatedAt())
                .build();
    }

    private Vendor toDomain(VendorJpaEntity e) {
        return Vendor.builder()
                .id(e.getId())
                .tenantId(e.getTenantId())
                .code(e.getCode())
                .name(e.getName())
                .taxId(e.getTaxId())
                .email(e.getEmail())
                .phone(e.getPhone())
                .address(e.getAddress())
                .city(e.getCity())
                .country(e.getCountry())
                .paymentTerms(e.getPaymentTerms())
                .currency(e.getCurrency())
                .active(e.isActive())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
