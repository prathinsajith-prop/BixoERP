package com.erp.manufacturing.api.controller;

import com.erp.manufacturing.api.dto.*;
import com.erp.manufacturing.application.usecase.CompleteWorkOrderUseCase;
import com.erp.manufacturing.application.usecase.CreateWorkOrderUseCase;
import com.erp.manufacturing.application.usecase.StartProductionUseCase;
import com.erp.manufacturing.domain.entity.WorkOrder;
import com.erp.manufacturing.domain.repository.WorkOrderRepository;
import com.erp.manufacturing.domain.valueobject.WorkOrderStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/work-orders")
@RequiredArgsConstructor
@Tag(name = "Work Orders", description = "Work Order management — production planning & execution")
public class WorkOrderController {

    private final CreateWorkOrderUseCase createWorkOrderUseCase;
    private final StartProductionUseCase startProductionUseCase;
    private final CompleteWorkOrderUseCase completeWorkOrderUseCase;
    private final WorkOrderRepository workOrderRepository;

    @PostMapping
    @Operation(summary = "Create a new work order")
    public ResponseEntity<WorkOrderResponse> create(
            @Valid @RequestBody CreateWorkOrderRequest request,
            Authentication authentication) {
        Map<String, Object> details = getAuthDetails(authentication);
        UUID tenantId = (UUID) details.get("tenant_id");
        UUID userId = (UUID) details.get("user_id");

        List<CreateWorkOrderUseCase.StepItem> steps = request.getSteps() != null
                ? request.getSteps().stream()
                    .map(s -> new CreateWorkOrderUseCase.StepItem(
                            s.getName(), s.getDescription(), s.getMachineId(),
                            s.getMachineName(), s.getEstimatedHours()))
                    .toList()
                : Collections.emptyList();

        WorkOrder wo = createWorkOrderUseCase.execute(
                tenantId, request.getBomId(), request.getQuantity(), request.getPriority(),
                request.getCurrency(), request.getNotes(), request.getSalesOrderId(), userId, steps);

        return ResponseEntity.status(HttpStatus.CREATED).body(WorkOrderResponse.fromDomain(wo));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get work order by ID")
    public ResponseEntity<WorkOrderResponse> getById(
            @PathVariable UUID id, Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        WorkOrder wo = workOrderRepository.findById(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found: " + id));
        return ResponseEntity.ok(WorkOrderResponse.fromDomain(wo));
    }

    @GetMapping
    @Operation(summary = "List work orders")
    public ResponseEntity<List<WorkOrderResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        List<WorkOrderResponse> orders = workOrderRepository.findByTenantId(tenantId, page, size)
                .stream().map(WorkOrderResponse::fromDomain).toList();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "List work orders by status")
    public ResponseEntity<List<WorkOrderResponse>> listByStatus(
            @PathVariable String status, Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        WorkOrderStatus woStatus = WorkOrderStatus.valueOf(status.toUpperCase());
        List<WorkOrderResponse> orders = workOrderRepository.findByStatus(tenantId, woStatus)
                .stream().map(WorkOrderResponse::fromDomain).toList();
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/{id}/schedule")
    @Operation(summary = "Schedule a work order")
    public ResponseEntity<WorkOrderResponse> schedule(
            @PathVariable UUID id,
            @Valid @RequestBody ScheduleWorkOrderRequest request,
            Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        WorkOrder wo = workOrderRepository.findById(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found: " + id));
        wo.schedule(request.getScheduledStart(), request.getScheduledEnd(), request.getProductionLine());
        WorkOrder saved = workOrderRepository.save(wo);
        return ResponseEntity.ok(WorkOrderResponse.fromDomain(saved));
    }

    @PostMapping("/{id}/start")
    @Operation(summary = "Start production for a work order")
    public ResponseEntity<WorkOrderResponse> start(
            @PathVariable UUID id, Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        WorkOrder wo = startProductionUseCase.execute(id, tenantId);
        return ResponseEntity.ok(WorkOrderResponse.fromDomain(wo));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Complete a work order")
    public ResponseEntity<WorkOrderResponse> complete(
            @PathVariable UUID id,
            @Valid @RequestBody CompleteWorkOrderRequest request,
            Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        WorkOrder wo = completeWorkOrderUseCase.execute(id, tenantId, request.getCompletedQuantity());
        return ResponseEntity.ok(WorkOrderResponse.fromDomain(wo));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel a work order")
    public ResponseEntity<WorkOrderResponse> cancel(
            @PathVariable UUID id, Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        WorkOrder wo = workOrderRepository.findById(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found: " + id));
        wo.cancel();
        WorkOrder saved = workOrderRepository.save(wo);
        return ResponseEntity.ok(WorkOrderResponse.fromDomain(saved));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getAuthDetails(Authentication authentication) {
        return (Map<String, Object>) authentication.getDetails();
    }

    private UUID getTenantId(Authentication authentication) {
        return (UUID) getAuthDetails(authentication).get("tenant_id");
    }
}
