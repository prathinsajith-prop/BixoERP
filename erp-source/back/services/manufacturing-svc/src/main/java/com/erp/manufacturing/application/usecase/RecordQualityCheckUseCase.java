package com.erp.manufacturing.application.usecase;

import com.erp.manufacturing.domain.entity.QualityCheck;
import com.erp.manufacturing.domain.entity.WorkOrder;
import com.erp.manufacturing.domain.event.ManufacturingEvents;
import com.erp.manufacturing.domain.repository.WorkOrderRepository;
import com.erp.manufacturing.domain.valueobject.QualityResult;
import com.erp.manufacturing.domain.valueobject.WorkOrderStatus;
import com.erp.manufacturing.infrastructure.persistence.OutboxEventJpaEntity;
import com.erp.manufacturing.infrastructure.persistence.QualityCheckJpaEntity;
import com.erp.manufacturing.infrastructure.persistence.SpringDataQualityCheckRepository;
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
public class RecordQualityCheckUseCase {

    private final WorkOrderRepository workOrderRepository;
    private final SpringDataQualityCheckRepository qualityCheckRepo;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    @Transactional
    public QualityCheck execute(UUID tenantId, UUID workOrderId, UUID stepId,
                                UUID inspectorId, QualityResult result, int sampleSize,
                                int defectCount, String parameters, String notes) {
        WorkOrder wo = workOrderRepository.findById(workOrderId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found: " + workOrderId));

        if (wo.getStatus() != WorkOrderStatus.IN_PROGRESS) {
            throw new IllegalStateException("Quality checks only for IN_PROGRESS work orders");
        }

        String checkNumber = generateCheckNumber(tenantId);

        QualityCheck qc = QualityCheck.create(tenantId, workOrderId, checkNumber, stepId,
                inspectorId, result, sampleSize, defectCount, parameters, notes);

        // Persist via JPA entity
        QualityCheckJpaEntity entity = QualityCheckJpaEntity.builder()
                .id(qc.getId())
                .tenantId(qc.getTenantId())
                .workOrderId(qc.getWorkOrderId())
                .checkNumber(qc.getCheckNumber())
                .stepId(qc.getStepId())
                .inspectorId(qc.getInspectorId())
                .result(qc.getResult().name())
                .sampleSize(qc.getSampleSize())
                .defectCount(qc.getDefectCount())
                .parameters(qc.getParameters())
                .notes(qc.getNotes())
                .checkedAt(qc.getCheckedAt())
                .createdAt(qc.getCreatedAt())
                .build();
        qualityCheckRepo.save(entity);

        // Publish events
        ManufacturingEvents.QualityCheckRecorded recordedEvent =
                new ManufacturingEvents.QualityCheckRecorded(qc);
        saveOutboxEvent(recordedEvent, "quality.check.recorded");

        if (qc.isFailed()) {
            ManufacturingEvents.QualityCheckFailed failedEvent =
                    new ManufacturingEvents.QualityCheckFailed(qc);
            saveOutboxEvent(failedEvent, "quality.check.failed");
            log.warn("Quality check FAILED for WO {} check {}: {} defects",
                    wo.getOrderNumber(), checkNumber, defectCount);
        }

        log.info("Recorded quality check {} result {} for WO {} tenant {}",
                checkNumber, result, wo.getOrderNumber(), tenantId);
        return qc;
    }

    private String generateCheckNumber(UUID tenantId) {
        long count = qualityCheckRepo.countByTenantId(tenantId);
        return "QC-%06d".formatted(count + 1);
    }

    private void saveOutboxEvent(com.erp.manufacturing.domain.event.DomainEvent event, String topic) {
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
