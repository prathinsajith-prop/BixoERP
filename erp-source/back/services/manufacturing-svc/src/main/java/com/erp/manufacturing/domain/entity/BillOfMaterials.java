package com.erp.manufacturing.domain.entity;

import com.erp.manufacturing.domain.valueobject.Money;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class BillOfMaterials {

    private UUID id;
    private UUID tenantId;
    private String bomNumber;
    private UUID productId;
    private String productName;
    private int version;
    private boolean active;
    private String notes;
    private UUID createdBy;
    private Instant createdAt;
    private Instant updatedAt;

    @Builder.Default
    private List<BomLine> lines = new ArrayList<>();

    public static BillOfMaterials create(UUID tenantId, String bomNumber, UUID productId,
                                         String productName, String notes, UUID createdBy) {
        return BillOfMaterials.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .bomNumber(bomNumber)
                .productId(productId)
                .productName(productName)
                .version(1)
                .active(true)
                .notes(notes)
                .createdBy(createdBy)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .lines(new ArrayList<>())
                .build();
    }

    public void addLine(UUID componentId, String componentName, BigDecimal quantity,
                        String unit, BigDecimal unitCost, String currency) {
        for (BomLine line : lines) {
            if (line.getComponentId().equals(componentId)) {
                throw new IllegalArgumentException("Component already exists in BOM: " + componentId);
            }
        }
        int lineNumber = lines.size() + 1;
        BomLine line = BomLine.create(this.id, lineNumber, componentId, componentName,
                quantity, unit, unitCost, currency);
        lines.add(line);
        this.updatedAt = Instant.now();
    }

    public Money calculateTotalMaterialCost() {
        if (lines.isEmpty()) {
            return Money.zero("USD");
        }
        String currency = lines.getFirst().getCurrency();
        Money total = Money.zero(currency);
        for (BomLine line : lines) {
            total = total.add(line.getLineCost());
        }
        return total;
    }

    public BillOfMaterials createNewVersion() {
        BillOfMaterials newBom = BillOfMaterials.builder()
                .id(UUID.randomUUID())
                .tenantId(this.tenantId)
                .bomNumber(this.bomNumber + "-V" + (this.version + 1))
                .productId(this.productId)
                .productName(this.productName)
                .version(this.version + 1)
                .active(true)
                .notes(this.notes)
                .createdBy(this.createdBy)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .lines(new ArrayList<>())
                .build();

        for (BomLine line : this.lines) {
            newBom.addLine(line.getComponentId(), line.getComponentName(),
                    line.getQuantity(), line.getUnit(), line.getUnitCost(), line.getCurrency());
        }

        this.active = false;
        this.updatedAt = Instant.now();

        return newBom;
    }

    public void deactivate() {
        this.active = false;
        this.updatedAt = Instant.now();
    }
}
