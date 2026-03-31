package com.erp.manufacturing.api.dto;

import com.erp.manufacturing.domain.entity.BillOfMaterials;
import com.erp.manufacturing.domain.entity.BomLine;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class BomResponse {

    private UUID id;
    private String bomNumber;
    private UUID productId;
    private String productName;
    private int version;
    private boolean active;
    private String notes;
    private UUID createdBy;
    private Instant createdAt;
    private Instant updatedAt;
    private List<LineResponse> lines;
    private BigDecimal totalMaterialCost;

    @Data
    @Builder
    public static class LineResponse {
        private UUID id;
        private int lineNumber;
        private UUID componentId;
        private String componentName;
        private BigDecimal quantity;
        private String unit;
        private BigDecimal unitCost;
        private String currency;
        private BigDecimal lineCost;
    }

    public static BomResponse fromDomain(BillOfMaterials bom) {
        List<LineResponse> lineResponses = bom.getLines().stream()
                .map(line -> LineResponse.builder()
                        .id(line.getId())
                        .lineNumber(line.getLineNumber())
                        .componentId(line.getComponentId())
                        .componentName(line.getComponentName())
                        .quantity(line.getQuantity())
                        .unit(line.getUnit())
                        .unitCost(line.getUnitCost())
                        .currency(line.getCurrency())
                        .lineCost(line.getLineCost().getAmount())
                        .build())
                .toList();

        return BomResponse.builder()
                .id(bom.getId())
                .bomNumber(bom.getBomNumber())
                .productId(bom.getProductId())
                .productName(bom.getProductName())
                .version(bom.getVersion())
                .active(bom.isActive())
                .notes(bom.getNotes())
                .createdBy(bom.getCreatedBy())
                .createdAt(bom.getCreatedAt())
                .updatedAt(bom.getUpdatedAt())
                .lines(lineResponses)
                .totalMaterialCost(bom.calculateTotalMaterialCost().getAmount())
                .build();
    }
}
