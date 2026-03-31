package com.erp.procurement.domain.entity;

import com.erp.procurement.domain.valueobject.Money;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class PurchaseOrderLine {

    private UUID id;
    private UUID purchaseOrderId;
    private int lineNumber;
    private String itemCode;
    private String description;
    private BigDecimal quantity;
    private BigDecimal receivedQuantity;
    private BigDecimal unitPrice;
    private String currency;
    private BigDecimal taxRate;
    private Money lineTotal;

    public static PurchaseOrderLine create(UUID purchaseOrderId, int lineNumber,
                                           String itemCode, String description,
                                           BigDecimal quantity, BigDecimal unitPrice,
                                           String currency, BigDecimal taxRate) {
        BigDecimal total = quantity.multiply(unitPrice).setScale(4, RoundingMode.HALF_UP);
        return PurchaseOrderLine.builder()
                .id(UUID.randomUUID())
                .purchaseOrderId(purchaseOrderId)
                .lineNumber(lineNumber)
                .itemCode(itemCode)
                .description(description)
                .quantity(quantity.setScale(4, RoundingMode.HALF_UP))
                .receivedQuantity(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP))
                .unitPrice(unitPrice.setScale(4, RoundingMode.HALF_UP))
                .currency(currency)
                .taxRate(taxRate.setScale(2, RoundingMode.HALF_UP))
                .lineTotal(Money.of(total, currency))
                .build();
    }

    public void receiveQuantity(BigDecimal qty) {
        BigDecimal newReceived = this.receivedQuantity.add(qty);
        if (newReceived.compareTo(this.quantity) > 0) {
            throw new IllegalStateException(
                    "Received quantity (%s) exceeds ordered quantity (%s) for line %d"
                            .formatted(newReceived, this.quantity, this.lineNumber));
        }
        this.receivedQuantity = newReceived;
    }

    public boolean isFullyReceived() {
        return receivedQuantity.compareTo(quantity) >= 0;
    }
}
