package com.erp.manufacturing.infrastructure.persistence;

import com.erp.manufacturing.domain.entity.WorkOrder;
import com.erp.manufacturing.domain.entity.WorkOrderStep;
import com.erp.manufacturing.domain.repository.WorkOrderRepository;
import com.erp.manufacturing.domain.valueobject.Money;
import com.erp.manufacturing.domain.valueobject.WorkOrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class JpaWorkOrderRepository implements WorkOrderRepository {

    private final SpringDataWorkOrderRepository jpaRepo;

    @Override
    public WorkOrder save(WorkOrder workOrder) {
        WorkOrderJpaEntity entity = toEntity(workOrder);
        WorkOrderJpaEntity saved = jpaRepo.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<WorkOrder> findById(UUID id, UUID tenantId) {
        return jpaRepo.findByIdAndTenantId(id, tenantId).map(this::toDomain);
    }

    @Override
    public Optional<WorkOrder> findByOrderNumber(String orderNumber, UUID tenantId) {
        return jpaRepo.findByOrderNumberAndTenantId(orderNumber, tenantId).map(this::toDomain);
    }

    @Override
    public List<WorkOrder> findByTenantId(UUID tenantId, int page, int size) {
        return jpaRepo.findByTenantId(tenantId,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toDomain)
                .getContent();
    }

    @Override
    public List<WorkOrder> findByStatus(UUID tenantId, WorkOrderStatus status) {
        return jpaRepo.findByTenantIdAndStatus(tenantId, status.name())
                .stream().map(this::toDomain).toList();
    }

    @Override
    public List<WorkOrder> findByBomId(UUID bomId, UUID tenantId) {
        return jpaRepo.findByBomIdAndTenantId(bomId, tenantId)
                .stream().map(this::toDomain).toList();
    }

    @Override
    public long countByTenantId(UUID tenantId) {
        return jpaRepo.countByTenantId(tenantId);
    }

    private WorkOrderJpaEntity toEntity(WorkOrder wo) {
        WorkOrderJpaEntity entity = WorkOrderJpaEntity.builder()
                .id(wo.getId())
                .tenantId(wo.getTenantId())
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
                .build();

        for (WorkOrderStep step : wo.getSteps()) {
            WorkOrderStepJpaEntity stepEntity = WorkOrderStepJpaEntity.builder()
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
                    .notes(step.getNotes())
                    .build();
            entity.addStep(stepEntity);
        }

        return entity;
    }

    private WorkOrder toDomain(WorkOrderJpaEntity entity) {
        List<WorkOrderStep> steps = entity.getSteps().stream()
                .map(se -> WorkOrderStep.builder()
                        .id(se.getId())
                        .workOrderId(entity.getId())
                        .stepNumber(se.getStepNumber())
                        .name(se.getName())
                        .description(se.getDescription())
                        .machineId(se.getMachineId())
                        .machineName(se.getMachineName())
                        .estimatedHours(se.getEstimatedHours())
                        .actualHours(se.getActualHours())
                        .status(se.getStatus())
                        .startedAt(se.getStartedAt())
                        .completedAt(se.getCompletedAt())
                        .completedBy(se.getCompletedBy())
                        .notes(se.getNotes())
                        .build())
                .toList();

        return WorkOrder.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .orderNumber(entity.getOrderNumber())
                .bomId(entity.getBomId())
                .bomVersion(entity.getBomVersion())
                .productId(entity.getProductId())
                .productName(entity.getProductName())
                .quantity(entity.getQuantity())
                .completedQuantity(entity.getCompletedQuantity())
                .status(WorkOrderStatus.valueOf(entity.getStatus()))
                .priority(entity.getPriority())
                .scheduledStart(entity.getScheduledStart())
                .scheduledEnd(entity.getScheduledEnd())
                .actualStart(entity.getActualStart())
                .actualEnd(entity.getActualEnd())
                .assignedLine(entity.getAssignedLine())
                .materialCost(Money.of(entity.getMaterialCost(), entity.getCurrency()))
                .laborCost(Money.of(entity.getLaborCost(), entity.getCurrency()))
                .overheadCost(Money.of(entity.getOverheadCost(), entity.getCurrency()))
                .totalCost(Money.of(entity.getTotalCost(), entity.getCurrency()))
                .currency(entity.getCurrency())
                .notes(entity.getNotes())
                .salesOrderId(entity.getSalesOrderId())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .steps(new ArrayList<>(steps))
                .build();
    }
}
