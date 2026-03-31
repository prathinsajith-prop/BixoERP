package com.erp.manufacturing.domain.entity;

import com.erp.manufacturing.domain.valueobject.Money;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class BomLine {

    private UUID id;
    private UUID bomId;
    private int lineNumber;
    private UUID componentId;
    private String componentName;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal unitCost;
    private String currency;
    private String notes;

    public static BomLine create(UUID bomId, int lineNumber, UUID componentId, String componentName,
                                 BigDecimal quantity, String unit, BigDecimal unitCost, String currency) {
        return BomLine.builder()
                .id(UUID.randomUUID())
                .bomId(bomId)
                .lineNumber(lineNumber)
                .componentId(componentId)
                .componentName(componentName)
                .quantity(quantity)
                .unit(unit)
                .unitCost(unitCost)
                .currency(currency)
                .build();
    }

    public Money getLineCost() {
        return Money.of(quantity.multiply(unitCost), currency);
    }
}
