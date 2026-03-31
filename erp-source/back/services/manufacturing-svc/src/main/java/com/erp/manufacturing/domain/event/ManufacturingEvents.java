package com.erp.manufacturing.domain.event;

import com.erp.manufacturing.domain.entity.QualityCheck;
import com.erp.manufacturing.domain.entity.WorkOrder;
import lombok.Getter;

import java.util.UUID;

public final class ManufacturingEvents {

    private ManufacturingEvents() {}

    private static final String WO_AGGREGATE = "WorkOrder";
    private static final String QC_AGGREGATE = "QualityCheck";

    @Getter
    public static class WorkOrderCreated extends DomainEvent {
        private final String orderNumber;
        private final UUID productId;
        private final String productName;
        private final String quantity;

        public WorkOrderCreated(WorkOrder wo) {
            super("work.order.created", wo.getId(), WO_AGGREGATE, wo.getTenantId());
            this.orderNumber = wo.getOrderNumber();
            this.productId = wo.getProductId();
            this.productName = wo.getProductName();
            this.quantity = wo.getQuantity().toPlainString();
        }
    }

    @Getter
    public static class WorkOrderScheduled extends DomainEvent {
        private final String orderNumber;
        private final String assignedLine;

        public WorkOrderScheduled(WorkOrder wo) {
            super("work.order.scheduled", wo.getId(), WO_AGGREGATE, wo.getTenantId());
            this.orderNumber = wo.getOrderNumber();
            this.assignedLine = wo.getAssignedLine();
        }
    }

    @Getter
    public static class WorkOrderStarted extends DomainEvent {
        private final String orderNumber;
        private final UUID productId;

        public WorkOrderStarted(WorkOrder wo) {
            super("work.order.started", wo.getId(), WO_AGGREGATE, wo.getTenantId());
            this.orderNumber = wo.getOrderNumber();
            this.productId = wo.getProductId();
        }
    }

    @Getter
    public static class WorkOrderCompleted extends DomainEvent {
        private final String orderNumber;
        private final UUID productId;
        private final String productName;
        private final String completedQuantity;
        private final String totalCost;
        private final String currency;

        public WorkOrderCompleted(WorkOrder wo) {
            super("work.order.completed", wo.getId(), WO_AGGREGATE, wo.getTenantId());
            this.orderNumber = wo.getOrderNumber();
            this.productId = wo.getProductId();
            this.productName = wo.getProductName();
            this.completedQuantity = wo.getCompletedQuantity().toPlainString();
            this.totalCost = wo.getTotalCost().getAmount().toPlainString();
            this.currency = wo.getCurrency();
        }
    }

    @Getter
    public static class WorkOrderCancelled extends DomainEvent {
        private final String orderNumber;

        public WorkOrderCancelled(WorkOrder wo) {
            super("work.order.cancelled", wo.getId(), WO_AGGREGATE, wo.getTenantId());
            this.orderNumber = wo.getOrderNumber();
        }
    }

    @Getter
    public static class QualityCheckRecorded extends DomainEvent {
        private final String checkNumber;
        private final UUID workOrderId;
        private final String result;

        public QualityCheckRecorded(QualityCheck qc) {
            super("quality.check.recorded", qc.getId(), QC_AGGREGATE, qc.getTenantId());
            this.checkNumber = qc.getCheckNumber();
            this.workOrderId = qc.getWorkOrderId();
            this.result = qc.getResult().name();
        }
    }

    @Getter
    public static class QualityCheckFailed extends DomainEvent {
        private final String checkNumber;
        private final UUID workOrderId;
        private final int defectCount;
        private final String notes;

        public QualityCheckFailed(QualityCheck qc) {
            super("quality.check.failed", qc.getId(), QC_AGGREGATE, qc.getTenantId());
            this.checkNumber = qc.getCheckNumber();
            this.workOrderId = qc.getWorkOrderId();
            this.defectCount = qc.getDefectCount();
            this.notes = qc.getNotes();
        }
    }
}
