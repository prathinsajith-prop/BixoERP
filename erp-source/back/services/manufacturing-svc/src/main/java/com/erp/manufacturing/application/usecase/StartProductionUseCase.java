package com.erp.manufacturing.application.usecase;

import com.erp.manufacturing.domain.entity.BillOfMaterials;
import com.erp.manufacturing.domain.entity.WorkOrder;
import com.erp.manufacturing.domain.event.ManufacturingEvents;
import com.erp.manufacturing.domain.repository.BomRepository;
import com.erp.manufacturing.domain.repository.WorkOrderRepository;
import com.erp.manufacturing.domain.service.ProductionCostCalculator;
import com.erp.manufacturing.infrastructure.persistence.OutboxEventJpaEntity;
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
public class StartProductionUseCase {

    private final WorkOrderRepository workOrderRepository;
    private final BomRepository bomRepository;
    private final ProductionCostCalculator costCalculator;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    @Transactional
    public WorkOrder execute(UUID workOrderId, UUID tenantId) {
        WorkOrder wo = workOrderRepository.findById(workOrderId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found: " + workOrderId));

        wo.startProduction();

        // Recalculate costs at production start
        BillOfMaterials bom = bomRepository.findById(wo.getBomId(), tenantId)
                .orElseThrow(() -> new IllegalStateException("BOM not found for work order: " + wo.getBomId()));
        costCalculator.recalculateCosts(wo, bom);

        WorkOrder saved = workOrderRepository.save(wo);

        ManufacturingEvents.WorkOrderStarted event = new ManufacturingEvents.WorkOrderStarted(saved);
        saveOutboxEvent(event, "work.order.started");

        log.info("Started production for WO {} tenant {}", saved.getOrderNumber(), tenantId);
        return saved;
    }

    private void saveOutboxEvent(ManufacturingEvents.WorkOrderStarted event, String topic) {
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
