package com.erp.procurement.api.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateRequisitionRequest {

    @NotBlank(message = "Item code is required")
    private String itemCode;

    private String description;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.0001", message = "Quantity must be greater than 0")
    private BigDecimal quantity;

    @DecimalMin(value = "0", message = "Estimated price must be non-negative")
    private BigDecimal estimatedPrice;

    @Size(min = 3, max = 3, message = "Currency must be a 3-letter code")
    private String currency = "USD";
}
