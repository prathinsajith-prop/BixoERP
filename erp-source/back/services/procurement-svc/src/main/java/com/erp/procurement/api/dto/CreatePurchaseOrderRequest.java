package com.erp.procurement.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class CreatePurchaseOrderRequest {

    @NotNull(message = "Vendor ID is required")
    private UUID vendorId;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be a 3-letter code")
    private String currency;

    private String notes;

    private LocalDate expectedDate;

    @NotEmpty(message = "At least one line item is required")
    @Valid
    private List<LineItemRequest> lines;

    @Data
    public static class LineItemRequest {

        @NotBlank(message = "Item code is required")
        private String itemCode;

        private String description;

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "0.0001", message = "Quantity must be greater than 0")
        private BigDecimal quantity;

        @NotNull(message = "Unit price is required")
        @DecimalMin(value = "0", message = "Unit price must be non-negative")
        private BigDecimal unitPrice;

        @NotNull(message = "Tax rate is required")
        @DecimalMin(value = "0", message = "Tax rate must be non-negative")
        @DecimalMax(value = "100", message = "Tax rate must not exceed 100")
        private BigDecimal taxRate;
    }
}
