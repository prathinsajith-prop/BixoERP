package com.erp.manufacturing.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class CreateWorkOrderRequest {

    @NotNull
    private UUID bomId;

    @NotNull
    @Positive
    private BigDecimal quantity;

    private int priority = 5;

    private String currency = "USD";

    private String notes;

    private UUID salesOrderId;

    @Valid
    private List<StepLine> steps;

    @Data
    public static class StepLine {
        @NotNull
        private String name;

        private String description;

        private UUID machineId;

        private String machineName;

        @NotNull
        @Positive
        private BigDecimal estimatedHours;
    }
}
