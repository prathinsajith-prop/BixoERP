package com.erp.manufacturing.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CompleteWorkOrderRequest {

    @NotNull
    @Positive
    private BigDecimal completedQuantity;
}
