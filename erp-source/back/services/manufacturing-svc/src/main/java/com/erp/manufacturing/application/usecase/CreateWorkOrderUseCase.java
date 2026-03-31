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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CreateWorkOrderUseCase {

    private final WorkOrderRepository workOrderRepository;
    private final BomRepository bomRepository;
    private final ProductionCostCalculator costCalculator;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    @Transactional
    public WorkOrder execute(UUID tenantId, UUID bomId, BigDecimal quantity, int priority,
                             String currency, String notes, UUID salesOrderId, UUID createdBy,
                             List<StepItem> steps) {
        BillOfMaterials bom = bomRepository.findById(bomId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("BOM not found: " + bomId));

        if (!bom.isActive()) {
            throw new IllegalArgumentException("BOM is inactive: " + bom.getBomNumber());
        }

        String orderNumber = generateOrderNumber(tenantId);

        WorkOrder wo = WorkOrder.create(tenantId, orderNumber, bom, quantity, priority,
                currency, notes, salesOrderId, createdBy);

        for (StepItem step : steps) {
            wo.addStep(step.name(), step.description(), step.machineId(),
                    step.machineName(), step.estimatedHours());
        }

        // Calculate initial estimated costs
        costCalculator.recalculateCosts(wo, bom);

        WorkOrder saved = workOrderRepository.save(wo);

        ManufacturingEvents.WorkOrderCreated event = new ManufacturingEvents.WorkOrderCreated(saved);
        saveOutboxEvent(event, "work.order.created");

        log.info("Created WO {} for product {} tenant {}", saved.getOrderNumber(),
                bom.getProductName(), tenantId);
        return saved;
    }

    private String generateOrderNumber(UUID tenantId) {
        long count = workOrderRepository.countByTenantId(tenantId);
        return "WO-%06d".formatted(count + 1);
    }

    private void saveOutboxEvent(ManufacturingEvents.WorkOrderCreated event, String topic) {
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

    public record StepItem(String name, String description, UUID machineId,
                           String machineName, BigDecimal estimatedHours) {}
}
