package com.erp.procurement.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "goods_receipts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceiptJpaEntity {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "receipt_number", nullable = false)
    private String receiptNumber;

    @Column(name = "purchase_order_id", nullable = false)
    private UUID purchaseOrderId;

    @Column(name = "received_by", nullable = false)
    private UUID receivedBy;

    @Column(name = "received_at", nullable = false)
    private Instant receivedAt;

    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
