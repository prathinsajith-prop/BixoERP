package com.erp.procurement.application.usecase;

import com.erp.procurement.domain.entity.PurchaseOrder;
import com.erp.procurement.domain.event.PurchaseOrderEvents;
import com.erp.procurement.domain.repository.PurchaseOrderRepository;
import com.erp.procurement.domain.service.PurchaseOrderValidator;
import com.erp.procurement.infrastructure.persistence.OutboxEventJpaEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApprovePurchaseOrderUseCase {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderValidator validator;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    @Transactional
    public PurchaseOrder execute(UUID poId, UUID tenantId, UUID approvedBy) {
        PurchaseOrder po = purchaseOrderRepository.findById(poId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + poId));

        validator.validateForApproval(po);
        po.approve(approvedBy);

        PurchaseOrder saved = purchaseOrderRepository.save(po);

        PurchaseOrderEvents.Approved event = new PurchaseOrderEvents.Approved(saved);
        saveOutboxEvent(event, "purchase.order.approved");

        log.info("Approved PO {} by {} for tenant {}", saved.getOrderNumber(), approvedBy, tenantId);
        return saved;
    }

    private void saveOutboxEvent(PurchaseOrderEvents.Approved event, String topic) {
        try {
            OutboxEventJpaEntity outbox = OutboxEventJpaEntity.builder()
                    .id(event.getEventId())
                    .aggregateType(event.getAggregateType())
                    .aggregateId(event.getAggregateId())
                    .eventType(event.getEventType())
                    .topic(topic)
                    .payload(objectMapper.writeValueAsString(event))
                    .tenantId(event.getTenantId())
                    .createdAt(Instant.now())
                    .build();
            entityManager.persist(outbox);
        } catch (Exception e) {
            log.error("Failed to save outbox event", e);
            throw new RuntimeException("Failed to serialize domain event", e);
        }
    }
}
