package com.erp.manufacturing.api.dto;

import com.erp.manufacturing.domain.entity.WorkOrder;
import com.erp.manufacturing.domain.entity.WorkOrderStep;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class WorkOrderResponse {

    private UUID id;
    private String orderNumber;
    private UUID bomId;
    private int bomVersion;
    private UUID productId;
    private String productName;
    private BigDecimal quantity;
    private BigDecimal completedQuantity;
    private String status;
    private int priority;
    private Instant scheduledStart;
    private Instant scheduledEnd;
    private Instant actualStart;
    private Instant actualEnd;
    private String assignedLine;
    private BigDecimal materialCost;
    private BigDecimal laborCost;
    private BigDecimal overheadCost;
    private BigDecimal totalCost;
    private String currency;
    private String notes;
    private UUID salesOrderId;
    private UUID createdBy;
    private Instant createdAt;
    private Instant updatedAt;
    private List<StepResponse> steps;

    @Data
    @Builder
    public static class StepResponse {
        private UUID id;
        private int stepNumber;
        private String name;
        private String description;
        private UUID machineId;
        private String machineName;
        private BigDecimal estimatedHours;
        private BigDecimal actualHours;
        private String status;
        private Instant startedAt;
        private Instant completedAt;
        private UUID completedBy;
    }

    public static WorkOrderResponse fromDomain(WorkOrder wo) {
        List<StepResponse> stepResponses = wo.getSteps().stream()
                .map(step -> StepResponse.builder()
                        .id(step.getId())
                        .stepNumber(step.getStepNumber())
                        .name(step.getName())
                        .description(step.getDescription())
                        .machineId(step.getMachineId())
                        .machineName(step.getMachineName())
                        .estimatedHours(step.getEstimatedHours())
                        .actualHours(step.getActualHours())
                        .status(step.getStatus())
                        .startedAt(step.getStartedAt())
                        .completedAt(step.getCompletedAt())
                        .completedBy(step.getCompletedBy())
                        .build())
                .toList();

        return WorkOrderResponse.builder()
                .id(wo.getId())
                .orderNumber(wo.getOrderNumber())
                .bomId(wo.getBomId())
                .bomVersion(wo.getBomVersion())
                .productId(wo.getProductId())
                .productName(wo.getProductName())
                .quantity(wo.getQuantity())
                .completedQuantity(wo.getCompletedQuantity())
                .status(wo.getStatus().name())
                .priority(wo.getPriority())
                .scheduledStart(wo.getScheduledStart())
                .scheduledEnd(wo.getScheduledEnd())
                .actualStart(wo.getActualStart())
                .actualEnd(wo.getActualEnd())
                .assignedLine(wo.getAssignedLine())
                .materialCost(wo.getMaterialCost().getAmount())
                .laborCost(wo.getLaborCost().getAmount())
                .overheadCost(wo.getOverheadCost().getAmount())
                .totalCost(wo.getTotalCost().getAmount())
                .currency(wo.getCurrency())
                .notes(wo.getNotes())
                .salesOrderId(wo.getSalesOrderId())
                .createdBy(wo.getCreatedBy())
                .createdAt(wo.getCreatedAt())
                .updatedAt(wo.getUpdatedAt())
                .steps(stepResponses)
                .build();
    }
}
