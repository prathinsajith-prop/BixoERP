package com.erp.manufacturing.domain.valueobject;

public enum QualityResult {
    PASS,
    FAIL,
    CONDITIONAL_PASS;

    public boolean isPassed() {
        return this == PASS || this == CONDITIONAL_PASS;
    }

    public boolean isFailed() {
        return this == FAIL;
    }
}
