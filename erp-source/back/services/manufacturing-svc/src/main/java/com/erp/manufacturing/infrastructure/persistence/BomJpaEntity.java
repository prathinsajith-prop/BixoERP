package com.erp.manufacturing.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "bill_of_materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BomJpaEntity {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "bom_number", nullable = false)
    private String bomNumber;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(nullable = false)
    private int version;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    private String notes;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "bom", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<BomLineJpaEntity> lines = new ArrayList<>();

    public void addLine(BomLineJpaEntity line) {
        lines.add(line);
        line.setBom(this);
    }
}
