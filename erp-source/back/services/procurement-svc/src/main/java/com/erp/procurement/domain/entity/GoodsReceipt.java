package com.erp.procurement.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class GoodsReceipt {

    private UUID id;
    private UUID tenantId;
    private String receiptNumber;
    private UUID purchaseOrderId;
    private UUID receivedBy;
    private Instant receivedAt;
    private String notes;
    private Instant createdAt;

    @Builder.Default
    private List<GoodsReceiptLine> lines = new ArrayList<>();

    public static GoodsReceipt create(UUID tenantId, String receiptNumber,
                                      UUID purchaseOrderId, UUID receivedBy, String notes) {
        return GoodsReceipt.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .receiptNumber(receiptNumber)
                .purchaseOrderId(purchaseOrderId)
                .receivedBy(receivedBy)
                .receivedAt(Instant.now())
                .notes(notes)
                .createdAt(Instant.now())
                .lines(new ArrayList<>())
                .build();
    }

    public void addLine(UUID poLineId, BigDecimal quantityReceived, boolean accepted, String rejectionReason) {
        GoodsReceiptLine line = GoodsReceiptLine.builder()
                .id(UUID.randomUUID())
                .goodsReceiptId(this.id)
                .poLineId(poLineId)
                .quantityReceived(quantityReceived)
                .accepted(accepted)
                .rejectionReason(rejectionReason)
                .build();
        lines.add(line);
    }

    /**
     * Applies the received quantities to PO lines and validates constraints.
     */
    public void applyTo(PurchaseOrder po) {
        Map<UUID, PurchaseOrderLine> lineMap = new java.util.HashMap<>();
        for (PurchaseOrderLine poLine : po.getLines()) {
            lineMap.put(poLine.getId(), poLine);
        }

        for (GoodsReceiptLine grLine : this.lines) {
            if (!grLine.isAccepted()) continue;
            PurchaseOrderLine poLine = lineMap.get(grLine.getPoLineId());
            if (poLine == null) {
                throw new IllegalArgumentException("PO line not found: " + grLine.getPoLineId());
            }
            poLine.receiveQuantity(grLine.getQuantityReceived());
        }

        po.receiveGoods(this);
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class GoodsReceiptLine {
        private UUID id;
        private UUID goodsReceiptId;
        private UUID poLineId;
        private BigDecimal quantityReceived;
        private boolean accepted;
        private String rejectionReason;
    }
}
