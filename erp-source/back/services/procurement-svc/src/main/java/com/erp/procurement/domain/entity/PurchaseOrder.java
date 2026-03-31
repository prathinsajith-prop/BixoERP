package com.erp.procurement.domain.entity;

import com.erp.procurement.domain.valueobject.Money;
import com.erp.procurement.domain.valueobject.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class PurchaseOrder {

    private UUID id;
    private UUID tenantId;
    private String orderNumber;
    private UUID vendorId;
    private OrderStatus status;
    private String currency;
    private Money subtotal;
    private Money tax;
    private Money total;
    private String notes;
    private LocalDate expectedDate;
    private UUID approvedBy;
    private Instant approvedAt;
    private UUID createdBy;
    private Instant createdAt;
    private Instant updatedAt;

    @Builder.Default
    private List<PurchaseOrderLine> lines = new ArrayList<>();

    public static PurchaseOrder create(UUID tenantId, String orderNumber, UUID vendorId,
                                       String currency, String notes, LocalDate expectedDate,
                                       UUID createdBy) {
        return PurchaseOrder.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .orderNumber(orderNumber)
                .vendorId(vendorId)
                .status(OrderStatus.DRAFT)
                .currency(currency)
                .subtotal(Money.zero(currency))
                .tax(Money.zero(currency))
                .total(Money.zero(currency))
                .notes(notes)
                .expectedDate(expectedDate)
                .createdBy(createdBy)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .lines(new ArrayList<>())
                .build();
    }

    public void addLine(String itemCode, String description, BigDecimal quantity,
                        BigDecimal unitPrice, BigDecimal taxRate) {
        if (status != OrderStatus.DRAFT) {
            throw new IllegalStateException("Cannot add lines to a non-DRAFT purchase order");
        }
        int lineNumber = lines.size() + 1;
        PurchaseOrderLine line = PurchaseOrderLine.create(
                this.id, lineNumber, itemCode, description, quantity, unitPrice, currency, taxRate);
        lines.add(line);
        recalculateTotals();
    }

    public void submitForApproval() {
        assertTransition(OrderStatus.PENDING_APPROVAL);
        if (lines.isEmpty()) {
            throw new IllegalStateException("Cannot submit a purchase order with no lines");
        }
        this.status = OrderStatus.PENDING_APPROVAL;
        this.updatedAt = Instant.now();
    }

    public void approve(UUID approver) {
        assertTransition(OrderStatus.APPROVED);
        this.status = OrderStatus.APPROVED;
        this.approvedBy = approver;
        this.approvedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void sendToVendor() {
        assertTransition(OrderStatus.SENT);
        this.status = OrderStatus.SENT;
        this.updatedAt = Instant.now();
    }

    public void markPartiallyReceived() {
        assertTransition(OrderStatus.PARTIALLY_RECEIVED);
        this.status = OrderStatus.PARTIALLY_RECEIVED;
        this.updatedAt = Instant.now();
    }

    public void markFullyReceived() {
        assertTransition(OrderStatus.RECEIVED);
        this.status = OrderStatus.RECEIVED;
        this.updatedAt = Instant.now();
    }

    public void cancel() {
        assertTransition(OrderStatus.CANCELLED);
        this.status = OrderStatus.CANCELLED;
        this.updatedAt = Instant.now();
    }

    public void receiveGoods(GoodsReceipt receipt) {
        if (status != OrderStatus.SENT && status != OrderStatus.PARTIALLY_RECEIVED) {
            throw new IllegalStateException("PO must be SENT or PARTIALLY_RECEIVED to receive goods");
        }

        boolean allFullyReceived = true;
        for (PurchaseOrderLine line : lines) {
            if (line.getReceivedQuantity().compareTo(line.getQuantity()) < 0) {
                allFullyReceived = false;
                break;
            }
        }

        if (allFullyReceived) {
            markFullyReceived();
        } else {
            markPartiallyReceived();
        }
    }

    private void recalculateTotals() {
        Money sub = Money.zero(currency);
        Money txTotal = Money.zero(currency);
        for (PurchaseOrderLine line : lines) {
            sub = sub.add(line.getLineTotal());
            Money lineTax = line.getLineTotal().multiply(
                    line.getTaxRate().divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP));
            txTotal = txTotal.add(lineTax);
        }
        this.subtotal = sub;
        this.tax = txTotal;
        this.total = sub.add(txTotal);
    }

    private void assertTransition(OrderStatus target) {
        if (!status.canTransitionTo(target)) {
            throw new IllegalStateException(
                    "Cannot transition from %s to %s".formatted(status, target));
        }
    }
}
