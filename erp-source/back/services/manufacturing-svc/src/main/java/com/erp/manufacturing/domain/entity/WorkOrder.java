package com.erp.manufacturing.domain.entity;

import com.erp.manufacturing.domain.valueobject.Money;
import com.erp.manufacturing.domain.valueobject.WorkOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class WorkOrder {

    private UUID id;
    private UUID tenantId;
    private String orderNumber;
    private UUID bomId;
    private int bomVersion;
    private UUID productId;
    private String productName;
    private BigDecimal quantity;
    private BigDecimal completedQuantity;
    private WorkOrderStatus status;
    private int priority;
    private Instant scheduledStart;
    private Instant scheduledEnd;
    private Instant actualStart;
    private Instant actualEnd;
    private String assignedLine;
    private Money materialCost;
    private Money laborCost;
    private Money overheadCost;
    private Money totalCost;
    private String currency;
    private String notes;
    private UUID salesOrderId;
    private UUID createdBy;
    private Instant createdAt;
    private Instant updatedAt;

    @Builder.Default
    private List<WorkOrderStep> steps = new ArrayList<>();

    public static WorkOrder create(UUID tenantId, String orderNumber, BillOfMaterials bom,
                                   BigDecimal quantity, int priority, String currency,
                                   String notes, UUID salesOrderId, UUID createdBy) {
        if (!bom.isActive()) {
            throw new IllegalArgumentException("Cannot create work order from inactive BOM");
        }
        return WorkOrder.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .orderNumber(orderNumber)
                .bomId(bom.getId())
                .bomVersion(bom.getVersion())
                .productId(bom.getProductId())
                .productName(bom.getProductName())
                .quantity(quantity)
                .completedQuantity(BigDecimal.ZERO)
                .status(WorkOrderStatus.PLANNED)
                .priority(priority)
                .materialCost(Money.zero(currency))
                .laborCost(Money.zero(currency))
                .overheadCost(Money.zero(currency))
                .totalCost(Money.zero(currency))
                .currency(currency)
                .notes(notes)
                .salesOrderId(salesOrderId)
                .createdBy(createdBy)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .steps(new ArrayList<>())
                .build();
    }

    public void addStep(String name, String description, UUID machineId,
                        String machineName, BigDecimal estimatedHours) {
        if (status != WorkOrderStatus.PLANNED && status != WorkOrderStatus.SCHEDULED) {
            throw new IllegalStateException("Cannot add steps to a work order in status: " + status);
        }
        int stepNumber = steps.size() + 1;
        WorkOrderStep step = WorkOrderStep.create(this.id, stepNumber, name, description,
                machineId, machineName, estimatedHours);
        steps.add(step);
        this.updatedAt = Instant.now();
    }

    public void schedule(Instant start, Instant end, String productionLine) {
        assertTransition(WorkOrderStatus.SCHEDULED);
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("Scheduled start must be before end");
        }
        this.status = WorkOrderStatus.SCHEDULED;
        this.scheduledStart = start;
        this.scheduledEnd = end;
        this.assignedLine = productionLine;
        this.updatedAt = Instant.now();
    }

    public void startProduction() {
        assertTransition(WorkOrderStatus.IN_PROGRESS);
        if (steps.isEmpty()) {
            throw new IllegalStateException("Work order must have at least one step to start production");
        }
        this.status = WorkOrderStatus.IN_PROGRESS;
        this.actualStart = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void complete(BigDecimal completedQty) {
        assertTransition(WorkOrderStatus.COMPLETED);
        if (hasFailedQualityChecksBlocking()) {
            throw new IllegalStateException("Cannot complete work order with unresolved failed quality checks");
        }
        boolean allStepsDone = steps.stream()
                .allMatch(s -> s.isCompleted() || s.isSkipped());
        if (!allStepsDone) {
            throw new IllegalStateException("All work order steps must be completed or skipped");
        }
        this.status = WorkOrderStatus.COMPLETED;
        this.completedQuantity = completedQty;
        this.actualEnd = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void cancel() {
        assertTransition(WorkOrderStatus.CANCELLED);
        this.status = WorkOrderStatus.CANCELLED;
        this.updatedAt = Instant.now();
    }

    public void updateCosts(Money material, Money labor, Money overhead) {
        this.materialCost = material;
        this.laborCost = labor;
        this.overheadCost = overhead;
        this.totalCost = material.add(labor).add(overhead);
        this.updatedAt = Instant.now();
    }

    // Flag set externally by use case after checking quality checks
    private boolean hasFailedQualityChecks;

    public void setHasFailedQualityChecks(boolean flag) {
        this.hasFailedQualityChecks = flag;
    }

    private boolean hasFailedQualityChecksBlocking() {
        return hasFailedQualityChecks;
    }

    private void assertTransition(WorkOrderStatus target) {
        if (!status.canTransitionTo(target)) {
            throw new IllegalStateException(
                    "Cannot transition from %s to %s".formatted(status, target));
        }
    }
}
