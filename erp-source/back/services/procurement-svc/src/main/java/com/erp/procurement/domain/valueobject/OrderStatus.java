package com.erp.procurement.domain.valueobject;

public enum OrderStatus {
    DRAFT,
    PENDING_APPROVAL,
    APPROVED,
    SENT,
    PARTIALLY_RECEIVED,
    RECEIVED,
    CANCELLED;

    public boolean canTransitionTo(OrderStatus target) {
        return switch (this) {
            case DRAFT -> target == PENDING_APPROVAL || target == CANCELLED;
            case PENDING_APPROVAL -> target == APPROVED || target == CANCELLED;
            case APPROVED -> target == SENT || target == CANCELLED;
            case SENT -> target == PARTIALLY_RECEIVED || target == RECEIVED || target == CANCELLED;
            case PARTIALLY_RECEIVED -> target == RECEIVED || target == CANCELLED;
            case RECEIVED, CANCELLED -> false;
        };
    }
}
