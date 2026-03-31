package com.erp.procurement.api.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateVendorRequest {

    @NotBlank(message = "Vendor code is required")
    @Size(max = 50, message = "Vendor code must not exceed 50 characters")
    private String code;

    @NotBlank(message = "Vendor name is required")
    @Size(max = 255, message = "Vendor name must not exceed 255 characters")
    private String name;

    private String taxId;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String country;

    @Min(value = 0, message = "Payment terms must be non-negative")
    private int paymentTerms = 30;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be a 3-letter code")
    private String currency = "USD";
}
