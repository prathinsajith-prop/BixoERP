package com.erp.procurement.domain.event;

import com.erp.procurement.domain.entity.PurchaseOrder;
import lombok.Getter;

import java.util.UUID;

public final class PurchaseOrderEvents {

    private PurchaseOrderEvents() {}

    private static final String AGGREGATE = "PurchaseOrder";

    @Getter
    public static class Created extends DomainEvent {
        private final String orderNumber;
        private final UUID vendorId;

        public Created(PurchaseOrder po) {
            super("purchase.order.created", po.getId(), AGGREGATE, po.getTenantId());
            this.orderNumber = po.getOrderNumber();
            this.vendorId = po.getVendorId();
        }
    }

    @Getter
    public static class Approved extends DomainEvent {
        private final String orderNumber;
        private final UUID approvedBy;

        public Approved(PurchaseOrder po) {
            super("purchase.order.approved", po.getId(), AGGREGATE, po.getTenantId());
            this.orderNumber = po.getOrderNumber();
            this.approvedBy = po.getApprovedBy();
        }
    }

    @Getter
    public static class Sent extends DomainEvent {
        private final String orderNumber;
        private final UUID vendorId;

        public Sent(PurchaseOrder po) {
            super("purchase.order.sent", po.getId(), AGGREGATE, po.getTenantId());
            this.orderNumber = po.getOrderNumber();
            this.vendorId = po.getVendorId();
        }
    }

    @Getter
    public static class Received extends DomainEvent {
        private final String orderNumber;
        private final UUID vendorId;
        private final String totalAmount;

        public Received(PurchaseOrder po) {
            super("purchase.order.received", po.getId(), AGGREGATE, po.getTenantId());
            this.orderNumber = po.getOrderNumber();
            this.vendorId = po.getVendorId();
            this.totalAmount = po.getTotal().getAmount().toPlainString();
        }
    }

    @Getter
    public static class Cancelled extends DomainEvent {
        private final String orderNumber;

        public Cancelled(PurchaseOrder po) {
            super("purchase.order.cancelled", po.getId(), AGGREGATE, po.getTenantId());
            this.orderNumber = po.getOrderNumber();
        }
    }
}
