package com.erp.manufacturing.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "bom_lines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BomLineJpaEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bom_id", nullable = false)
    private BomJpaEntity bom;

    @Column(name = "line_number", nullable = false)
    private int lineNumber;

    @Column(name = "component_id", nullable = false)
    private UUID componentId;

    @Column(name = "component_name", nullable = false)
    private String componentName;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal quantity;

    @Column(nullable = false)
    private String unit;

    @Column(name = "unit_cost", nullable = false, precision = 19, scale = 4)
    private BigDecimal unitCost;

    @Column(nullable = false)
    private String currency;

    private String notes;
}
