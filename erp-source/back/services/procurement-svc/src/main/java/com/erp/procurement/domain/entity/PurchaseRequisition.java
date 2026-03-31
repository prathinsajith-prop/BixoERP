package com.erp.procurement.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class PurchaseRequisition {

    private UUID id;
    private UUID tenantId;
    private String requisitionNumber;
    private String status;
    private String itemCode;
    private String description;
    private BigDecimal quantity;
    private BigDecimal estimatedPrice;
    private String currency;
    private UUID requestedBy;
    private UUID approvedBy;
    private Instant approvedAt;
    private UUID purchaseOrderId;
    private Instant createdAt;
    private Instant updatedAt;

    public static PurchaseRequisition create(UUID tenantId, String requisitionNumber,
                                             String itemCode, String description,
                                             BigDecimal quantity, BigDecimal estimatedPrice,
                                             String currency, UUID requestedBy) {
        return PurchaseRequisition.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .requisitionNumber(requisitionNumber)
                .status("DRAFT")
                .itemCode(itemCode)
                .description(description)
                .quantity(quantity)
                .estimatedPrice(estimatedPrice)
                .currency(currency)
                .requestedBy(requestedBy)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    public void submit() {
        if (!"DRAFT".equals(this.status)) {
            throw new IllegalStateException("Requisition must be in DRAFT status to submit");
        }
        this.status = "PENDING_APPROVAL";
        this.updatedAt = Instant.now();
    }

    public void approve(UUID approver) {
        if (!"PENDING_APPROVAL".equals(this.status)) {
            throw new IllegalStateException("Requisition must be PENDING_APPROVAL to approve");
        }
        this.status = "APPROVED";
        this.approvedBy = approver;
        this.approvedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void linkToPurchaseOrder(UUID poId) {
        if (!"APPROVED".equals(this.status)) {
            throw new IllegalStateException("Requisition must be APPROVED to link to PO");
        }
        this.purchaseOrderId = poId;
        this.status = "FULFILLED";
        this.updatedAt = Instant.now();
    }

    public void reject() {
        if (!"PENDING_APPROVAL".equals(this.status)) {
            throw new IllegalStateException("Requisition must be PENDING_APPROVAL to reject");
        }
        this.status = "REJECTED";
        this.updatedAt = Instant.now();
    }
}
