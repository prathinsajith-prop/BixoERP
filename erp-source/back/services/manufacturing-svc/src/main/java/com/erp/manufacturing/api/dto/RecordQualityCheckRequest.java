package com.erp.manufacturing.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.util.UUID;

@Data
public class RecordQualityCheckRequest {

    @NotNull
    private UUID workOrderId;

    private UUID stepId;

    @NotNull
    private String result; // PASS, FAIL, CONDITIONAL_PASS

    @PositiveOrZero
    private int sampleSize = 1;

    @PositiveOrZero
    private int defectCount = 0;

    private String parameters;

    private String notes;
}
