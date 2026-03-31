package com.erp.procurement.application.usecase;

import com.erp.procurement.domain.entity.PurchaseRequisition;
import com.erp.procurement.infrastructure.persistence.PurchaseRequisitionJpaEntity;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CreateRequisitionUseCase {

    private final EntityManager entityManager;

    @Transactional
    public PurchaseRequisition execute(UUID tenantId, String itemCode, String description,
                                       BigDecimal quantity, BigDecimal estimatedPrice,
                                       String currency, UUID requestedBy) {
        String requisitionNumber = "PR-%06d".formatted(System.currentTimeMillis() % 1000000);

        PurchaseRequisition requisition = PurchaseRequisition.create(
                tenantId, requisitionNumber, itemCode, description,
                quantity, estimatedPrice, currency, requestedBy);

        PurchaseRequisitionJpaEntity entity = mapToJpaEntity(requisition);
        entityManager.persist(entity);

        log.info("Created requisition {} for tenant {}", requisitionNumber, tenantId);
        return requisition;
    }

    private PurchaseRequisitionJpaEntity mapToJpaEntity(PurchaseRequisition req) {
        PurchaseRequisitionJpaEntity entity = new PurchaseRequisitionJpaEntity();
        entity.setId(req.getId());
        entity.setTenantId(req.getTenantId());
        entity.setRequisitionNumber(req.getRequisitionNumber());
        entity.setStatus(req.getStatus());
        entity.setItemCode(req.getItemCode());
        entity.setDescription(req.getDescription());
        entity.setQuantity(req.getQuantity());
        entity.setEstimatedPrice(req.getEstimatedPrice());
        entity.setCurrency(req.getCurrency());
        entity.setRequestedBy(req.getRequestedBy());
        entity.setCreatedAt(req.getCreatedAt());
        entity.setUpdatedAt(req.getUpdatedAt());
        return entity;
    }
}
