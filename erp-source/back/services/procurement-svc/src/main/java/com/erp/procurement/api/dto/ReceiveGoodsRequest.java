package com.erp.procurement.api.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class ReceiveGoodsRequest {

    @NotNull(message = "Purchase order ID is required")
    private UUID purchaseOrderId;

    private String notes;

    @NotEmpty(message = "At least one receipt line is required")
    private List<ReceiptLineRequest> lines;

    @Data
    public static class ReceiptLineRequest {

        @NotNull(message = "PO line ID is required")
        private UUID poLineId;

        @NotNull(message = "Quantity received is required")
        @DecimalMin(value = "0.0001", message = "Quantity must be greater than 0")
        private BigDecimal quantityReceived;

        private boolean accepted = true;

        private String rejectionReason;
    }
}
