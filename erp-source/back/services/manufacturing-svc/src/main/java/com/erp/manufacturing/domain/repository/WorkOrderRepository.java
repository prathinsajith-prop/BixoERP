package com.erp.manufacturing.domain.repository;

import com.erp.manufacturing.domain.entity.WorkOrder;
import com.erp.manufacturing.domain.valueobject.WorkOrderStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkOrderRepository {

    WorkOrder save(WorkOrder workOrder);

    Optional<WorkOrder> findById(UUID id, UUID tenantId);

    Optional<WorkOrder> findByOrderNumber(String orderNumber, UUID tenantId);

    List<WorkOrder> findByTenantId(UUID tenantId, int page, int size);

    List<WorkOrder> findByStatus(UUID tenantId, WorkOrderStatus status);

    List<WorkOrder> findByBomId(UUID bomId, UUID tenantId);

    long countByTenantId(UUID tenantId);
}
