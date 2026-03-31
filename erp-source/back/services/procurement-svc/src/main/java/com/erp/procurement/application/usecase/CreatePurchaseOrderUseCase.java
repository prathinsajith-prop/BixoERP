package com.erp.procurement.application.usecase;

import com.erp.procurement.domain.entity.PurchaseOrder;
import com.erp.procurement.domain.entity.PurchaseOrderLine;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CreatePurchaseOrderUseCase {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderValidator validator;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    @Transactional
    public PurchaseOrder execute(UUID tenantId, UUID vendorId, String currency,
                                 String notes, LocalDate expectedDate, UUID createdBy,
                                 List<LineItem> lines) {
        String orderNumber = generateOrderNumber(tenantId);

        PurchaseOrder po = PurchaseOrder.create(tenantId, orderNumber, vendorId,
                currency, notes, expectedDate, createdBy);

        validator.validateForCreation(po);

        for (LineItem item : lines) {
            po.addLine(item.itemCode(), item.description(), item.quantity(),
                    item.unitPrice(), item.taxRate());
        }

        PurchaseOrder saved = purchaseOrderRepository.save(po);

        PurchaseOrderEvents.Created event = new PurchaseOrderEvents.Created(saved);
        saveOutboxEvent(event, "purchase.order.created");

        log.info("Created PO {} for tenant {}", saved.getOrderNumber(), tenantId);
        return saved;
    }

    private String generateOrderNumber(UUID tenantId) {
        long count = purchaseOrderRepository.countByTenantId(tenantId);
        return "PO-%06d".formatted(count + 1);
    }

    private void saveOutboxEvent(PurchaseOrderEvents.Created event, String topic) {
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

    public record LineItem(String itemCode, String description, BigDecimal quantity,
                           BigDecimal unitPrice, BigDecimal taxRate) {}
}
