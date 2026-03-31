package com.erp.manufacturing.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class CreateBomRequest {

    @NotNull
    private UUID productId;

    @NotBlank
    private String productName;

    private String notes;

    @Valid
    private List<ComponentLine> components;

    @Data
    public static class ComponentLine {
        @NotNull
        private UUID componentId;

        @NotBlank
        private String componentName;

        @NotNull
        private BigDecimal quantity;

        private String unit = "PCS";

        @NotNull
        private BigDecimal unitCost;

        private String currency = "USD";
    }
}
