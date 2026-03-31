package com.erp.manufacturing.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class WorkOrderStep {

    private UUID id;
    private UUID workOrderId;
    private int stepNumber;
    private String name;
    private String description;
    private UUID machineId;
    private String machineName;
    private BigDecimal estimatedHours;
    private BigDecimal actualHours;
    private String status; // PENDING, IN_PROGRESS, COMPLETED, SKIPPED
    private Instant startedAt;
    private Instant completedAt;
    private UUID completedBy;
    private String notes;

    public static WorkOrderStep create(UUID workOrderId, int stepNumber, String name,
                                       String description, UUID machineId, String machineName,
                                       BigDecimal estimatedHours) {
        return WorkOrderStep.builder()
                .id(UUID.randomUUID())
                .workOrderId(workOrderId)
                .stepNumber(stepNumber)
                .name(name)
                .description(description)
                .machineId(machineId)
                .machineName(machineName)
                .estimatedHours(estimatedHours)
                .status("PENDING")
                .build();
    }

    public void start() {
        if (!"PENDING".equals(status)) {
            throw new IllegalStateException("Step must be PENDING to start, current: " + status);
        }
        this.status = "IN_PROGRESS";
        this.startedAt = Instant.now();
    }

    public void complete(UUID userId, BigDecimal actualHrs) {
        if (!"IN_PROGRESS".equals(status)) {
            throw new IllegalStateException("Step must be IN_PROGRESS to complete, current: " + status);
        }
        this.status = "COMPLETED";
        this.completedAt = Instant.now();
        this.completedBy = userId;
        this.actualHours = actualHrs;
    }

    public boolean isCompleted() {
        return "COMPLETED".equals(status);
    }

    public boolean isSkipped() {
        return "SKIPPED".equals(status);
    }
}
