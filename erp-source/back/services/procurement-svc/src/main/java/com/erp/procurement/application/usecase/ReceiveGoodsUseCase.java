package com.erp.procurement.application.usecase;

import com.erp.procurement.domain.entity.GoodsReceipt;
import com.erp.procurement.domain.entity.PurchaseOrder;
import com.erp.procurement.domain.event.PurchaseOrderEvents;
import com.erp.procurement.domain.repository.PurchaseOrderRepository;
import com.erp.procurement.domain.valueobject.OrderStatus;
import com.erp.procurement.infrastructure.persistence.GoodsReceiptJpaEntity;
import com.erp.procurement.infrastructure.persistence.OutboxEventJpaEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReceiveGoodsUseCase {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    @Transactional
    public GoodsReceipt execute(UUID tenantId, UUID poId, UUID receivedBy,
                                String notes, List<ReceiptLine> receiptLines) {
        PurchaseOrder po = purchaseOrderRepository.findById(poId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + poId));

        if (po.getStatus() != OrderStatus.SENT && po.getStatus() != OrderStatus.PARTIALLY_RECEIVED) {
            throw new IllegalStateException("PO must be SENT or PARTIALLY_RECEIVED to receive goods");
        }

        String receiptNumber = "GR-%s-%d".formatted(
                po.getOrderNumber(), System.currentTimeMillis() % 100000);

        GoodsReceipt receipt = GoodsReceipt.create(tenantId, receiptNumber, poId, receivedBy, notes);

        for (ReceiptLine line : receiptLines) {
            receipt.addLine(line.poLineId(), line.quantityReceived(), line.accepted(), line.rejectionReason());
        }

        receipt.applyTo(po);
        purchaseOrderRepository.save(po);

        GoodsReceiptJpaEntity grEntity = mapToJpaEntity(receipt);
        entityManager.persist(grEntity);

        if (po.getStatus() == OrderStatus.RECEIVED) {
            PurchaseOrderEvents.Received event = new PurchaseOrderEvents.Received(po);
            saveOutboxEvent(event, "purchase.order.received");
        }

        log.info("Goods receipt {} created for PO {} tenant {}", receiptNumber, po.getOrderNumber(), tenantId);
        return receipt;
    }

    private GoodsReceiptJpaEntity mapToJpaEntity(GoodsReceipt receipt) {
        GoodsReceiptJpaEntity entity = new GoodsReceiptJpaEntity();
        entity.setId(receipt.getId());
        entity.setTenantId(receipt.getTenantId());
        entity.setReceiptNumber(receipt.getReceiptNumber());
        entity.setPurchaseOrderId(receipt.getPurchaseOrderId());
        entity.setReceivedBy(receipt.getReceivedBy());
        entity.setReceivedAt(receipt.getReceivedAt());
        entity.setNotes(receipt.getNotes());
        entity.setCreatedAt(receipt.getCreatedAt());
        return entity;
    }

    private void saveOutboxEvent(PurchaseOrderEvents.Received event, String topic) {
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

    public record ReceiptLine(UUID poLineId, BigDecimal quantityReceived,
                               boolean accepted, String rejectionReason) {}
}
