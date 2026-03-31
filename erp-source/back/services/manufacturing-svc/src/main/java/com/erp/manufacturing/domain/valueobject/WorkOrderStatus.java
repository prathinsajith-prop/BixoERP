package com.erp.manufacturing.domain.valueobject;

public enum WorkOrderStatus {
    PLANNED,
    SCHEDULED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED;

    public boolean canTransitionTo(WorkOrderStatus target) {
        return switch (this) {
            case PLANNED -> target == SCHEDULED || target == CANCELLED;
            case SCHEDULED -> target == IN_PROGRESS || target == CANCELLED;
            case IN_PROGRESS -> target == COMPLETED || target == CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
    }

    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED;
    }
}
