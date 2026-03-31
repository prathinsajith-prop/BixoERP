package com.erp.procurement.infrastructure.persistence;

import com.erp.procurement.domain.entity.PurchaseOrder;
import com.erp.procurement.domain.entity.PurchaseOrderLine;
import com.erp.procurement.domain.repository.PurchaseOrderRepository;
import com.erp.procurement.domain.valueobject.Money;
import com.erp.procurement.domain.valueobject.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class JpaPurchaseOrderRepository implements PurchaseOrderRepository {

    private final SpringDataPurchaseOrderRepository jpaRepo;

    @Override
    public PurchaseOrder save(PurchaseOrder order) {
        PurchaseOrderJpaEntity entity = toEntity(order);
        PurchaseOrderJpaEntity saved = jpaRepo.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<PurchaseOrder> findById(UUID id, UUID tenantId) {
        return jpaRepo.findByIdAndTenantId(id, tenantId).map(this::toDomain);
    }

    @Override
    public Optional<PurchaseOrder> findByOrderNumber(String orderNumber, UUID tenantId) {
        return jpaRepo.findByOrderNumberAndTenantId(orderNumber, tenantId).map(this::toDomain);
    }

    @Override
    public List<PurchaseOrder> findByTenantId(UUID tenantId, int page, int size) {
        return jpaRepo.findByTenantId(tenantId,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toDomain)
                .getContent();
    }

    @Override
    public List<PurchaseOrder> findByVendorId(UUID vendorId, UUID tenantId) {
        return jpaRepo.findByVendorIdAndTenantId(vendorId, tenantId)
                .stream().map(this::toDomain).toList();
    }

    @Override
    public long countByTenantId(UUID tenantId) {
        return jpaRepo.countByTenantId(tenantId);
    }

    private PurchaseOrderJpaEntity toEntity(PurchaseOrder po) {
        PurchaseOrderJpaEntity entity = PurchaseOrderJpaEntity.builder()
                .id(po.getId())
                .tenantId(po.getTenantId())
                .orderNumber(po.getOrderNumber())
                .vendorId(po.getVendorId())
                .status(po.getStatus().name())
                .currency(po.getCurrency())
                .subtotalAmount(po.getSubtotal().getAmount())
                .taxAmount(po.getTax().getAmount())
                .totalAmount(po.getTotal().getAmount())
                .notes(po.getNotes())
                .expectedDate(po.getExpectedDate())
                .approvedBy(po.getApprovedBy())
                .approvedAt(po.getApprovedAt())
                .createdBy(po.getCreatedBy())
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt())
                .build();

        for (PurchaseOrderLine line : po.getLines()) {
            PurchaseOrderLineJpaEntity lineEntity = PurchaseOrderLineJpaEntity.builder()
                    .id(line.getId())
                    .lineNumber(line.getLineNumber())
                    .itemCode(line.getItemCode())
                    .description(line.getDescription())
                    .quantity(line.getQuantity())
                    .receivedQuantity(line.getReceivedQuantity())
                    .unitPrice(line.getUnitPrice())
                    .currency(line.getCurrency())
                    .taxRate(line.getTaxRate())
                    .lineTotal(line.getLineTotal().getAmount())
                    .build();
            entity.addLine(lineEntity);
        }

        return entity;
    }

    private PurchaseOrder toDomain(PurchaseOrderJpaEntity entity) {
        List<PurchaseOrderLine> lines = entity.getLines().stream()
                .map(le -> PurchaseOrderLine.builder()
                        .id(le.getId())
                        .purchaseOrderId(entity.getId())
                        .lineNumber(le.getLineNumber())
                        .itemCode(le.getItemCode())
                        .description(le.getDescription())
                        .quantity(le.getQuantity())
                        .receivedQuantity(le.getReceivedQuantity())
                        .unitPrice(le.getUnitPrice())
                        .currency(le.getCurrency())
                        .taxRate(le.getTaxRate())
                        .lineTotal(Money.of(le.getLineTotal(), le.getCurrency()))
                        .build())
                .toList();

        return PurchaseOrder.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .orderNumber(entity.getOrderNumber())
                .vendorId(entity.getVendorId())
                .status(OrderStatus.valueOf(entity.getStatus()))
                .currency(entity.getCurrency())
                .subtotal(Money.of(entity.getSubtotalAmount(), entity.getCurrency()))
                .tax(Money.of(entity.getTaxAmount(), entity.getCurrency()))
                .total(Money.of(entity.getTotalAmount(), entity.getCurrency()))
                .notes(entity.getNotes())
                .expectedDate(entity.getExpectedDate())
                .approvedBy(entity.getApprovedBy())
                .approvedAt(entity.getApprovedAt())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .lines(new java.util.ArrayList<>(lines))
                .build();
    }
}
