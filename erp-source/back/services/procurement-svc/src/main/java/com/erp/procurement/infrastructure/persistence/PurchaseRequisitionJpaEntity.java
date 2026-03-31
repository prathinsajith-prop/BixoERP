package com.erp.procurement.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "purchase_requisitions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequisitionJpaEntity {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "requisition_number", nullable = false)
    private String requisitionNumber;

    @Column(nullable = false)
    private String status;

    @Column(name = "item_code", nullable = false)
    private String itemCode;

    private String description;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal quantity;

    @Column(name = "estimated_price", precision = 19, scale = 4)
    private BigDecimal estimatedPrice;

    private String currency;

    @Column(name = "requested_by", nullable = false)
    private UUID requestedBy;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "purchase_order_id")
    private UUID purchaseOrderId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
