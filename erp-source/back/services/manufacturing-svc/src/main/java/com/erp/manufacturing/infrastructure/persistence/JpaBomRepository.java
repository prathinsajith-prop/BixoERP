package com.erp.manufacturing.infrastructure.persistence;

import com.erp.manufacturing.domain.entity.BillOfMaterials;
import com.erp.manufacturing.domain.entity.BomLine;
import com.erp.manufacturing.domain.repository.BomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class JpaBomRepository implements BomRepository {

    private final SpringDataBomRepository jpaRepo;

    @Override
    public BillOfMaterials save(BillOfMaterials bom) {
        BomJpaEntity entity = toEntity(bom);
        BomJpaEntity saved = jpaRepo.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<BillOfMaterials> findById(UUID id, UUID tenantId) {
        return jpaRepo.findByIdAndTenantId(id, tenantId).map(this::toDomain);
    }

    @Override
    public Optional<BillOfMaterials> findByBomNumber(String bomNumber, UUID tenantId) {
        return jpaRepo.findByBomNumberAndTenantId(bomNumber, tenantId).map(this::toDomain);
    }

    @Override
    public Optional<BillOfMaterials> findActiveByProductId(UUID productId, UUID tenantId) {
        return jpaRepo.findByProductIdAndTenantIdAndActiveTrue(productId, tenantId).map(this::toDomain);
    }

    @Override
    public List<BillOfMaterials> findByTenantId(UUID tenantId, int page, int size) {
        return jpaRepo.findByTenantId(tenantId,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toDomain)
                .getContent();
    }

    @Override
    public long countByTenantId(UUID tenantId) {
        return jpaRepo.countByTenantId(tenantId);
    }

    private BomJpaEntity toEntity(BillOfMaterials bom) {
        BomJpaEntity entity = BomJpaEntity.builder()
                .id(bom.getId())
                .tenantId(bom.getTenantId())
                .bomNumber(bom.getBomNumber())
                .productId(bom.getProductId())
                .productName(bom.getProductName())
                .version(bom.getVersion())
                .active(bom.isActive())
                .notes(bom.getNotes())
                .createdBy(bom.getCreatedBy())
                .createdAt(bom.getCreatedAt())
                .updatedAt(bom.getUpdatedAt())
                .build();

        for (BomLine line : bom.getLines()) {
            BomLineJpaEntity lineEntity = BomLineJpaEntity.builder()
                    .id(line.getId())
                    .lineNumber(line.getLineNumber())
                    .componentId(line.getComponentId())
                    .componentName(line.getComponentName())
                    .quantity(line.getQuantity())
                    .unit(line.getUnit())
                    .unitCost(line.getUnitCost())
                    .currency(line.getCurrency())
                    .notes(line.getNotes())
                    .build();
            entity.addLine(lineEntity);
        }

        return entity;
    }

    private BillOfMaterials toDomain(BomJpaEntity entity) {
        List<BomLine> lines = entity.getLines().stream()
                .map(le -> BomLine.builder()
                        .id(le.getId())
                        .bomId(entity.getId())
                        .lineNumber(le.getLineNumber())
                        .componentId(le.getComponentId())
                        .componentName(le.getComponentName())
                        .quantity(le.getQuantity())
                        .unit(le.getUnit())
                        .unitCost(le.getUnitCost())
                        .currency(le.getCurrency())
                        .notes(le.getNotes())
                        .build())
                .toList();

        return BillOfMaterials.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .bomNumber(entity.getBomNumber())
                .productId(entity.getProductId())
                .productName(entity.getProductName())
                .version(entity.getVersion())
                .active(entity.isActive())
                .notes(entity.getNotes())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .lines(new ArrayList<>(lines))
                .build();
    }
}
