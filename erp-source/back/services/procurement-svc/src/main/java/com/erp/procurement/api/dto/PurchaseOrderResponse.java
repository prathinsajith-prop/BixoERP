package com.erp.procurement.api.dto;

import com.erp.procurement.domain.entity.PurchaseOrder;
import com.erp.procurement.domain.entity.PurchaseOrderLine;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PurchaseOrderResponse {

    private UUID id;
    private String orderNumber;
    private UUID vendorId;
    private String status;
    private String currency;
    private BigDecimal subtotalAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String notes;
    private LocalDate expectedDate;
    private UUID approvedBy;
    private Instant approvedAt;
    private UUID createdBy;
    private Instant createdAt;
    private Instant updatedAt;
    private List<LineResponse> lines;

    @Data
    @Builder
    public static class LineResponse {
        private UUID id;
        private int lineNumber;
        private String itemCode;
        private String description;
        private BigDecimal quantity;
        private BigDecimal receivedQuantity;
        private BigDecimal unitPrice;
        private String currency;
        private BigDecimal taxRate;
        private BigDecimal lineTotal;
    }

    public static PurchaseOrderResponse fromDomain(PurchaseOrder po) {
        List<LineResponse> lineResponses = po.getLines().stream()
                .map(line -> LineResponse.builder()
                        .id(line.getId())
                        .lineNumber(line.getLineNumber())
                        .itemCode(line.getItemCode())
                        .description(line.getDescription())
                        .quantity(line.getQuantity())
                        .receivedQuantity(line.getReceivedQuantity())
                        .unitPrice(line.getUnitPrice())
                        .currency(line.getCurrency())
                        .taxRate(line.getTaxRate())
                        .lineTotal(line.getLineTotal().getAmount())
                        .build())
                .toList();

        return PurchaseOrderResponse.builder()
                .id(po.getId())
                .orderNumber(po.getOrderNumber())
                .vendorId(po.getVendorId())
                .status(po.getStatus().name())
                .currency(po.getCurrency())
                .subtotalAmount(po.getSubtotal().getAmount())
                .taxAmount(po.getTax().getAmount())
                .totalAmount(po.getTotal().getAmount())
                .notes(po.getNotes())
                .expectedDate(po.getExpectedDate())
                .approvedBy(po.getApprovedBy())
                .approvedAt(po.getApprovedAt())
                .createdBy(po.getCreatedBy())
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt())
                .lines(lineResponses)
                .build();
    }
}
