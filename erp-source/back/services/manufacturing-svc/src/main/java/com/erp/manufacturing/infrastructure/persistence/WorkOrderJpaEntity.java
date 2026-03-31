package com.erp.manufacturing.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "work_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderJpaEntity {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "order_number", nullable = false)
    private String orderNumber;

    @Column(name = "bom_id", nullable = false)
    private UUID bomId;

    @Column(name = "bom_version", nullable = false)
    private int bomVersion;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal quantity;

    @Column(name = "completed_quantity", nullable = false, precision = 19, scale = 4)
    private BigDecimal completedQuantity;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private int priority;

    @Column(name = "scheduled_start")
    private Instant scheduledStart;

    @Column(name = "scheduled_end")
    private Instant scheduledEnd;

    @Column(name = "actual_start")
    private Instant actualStart;

    @Column(name = "actual_end")
    private Instant actualEnd;

    @Column(name = "assigned_line")
    private String assignedLine;

    @Column(name = "material_cost", nullable = false, precision = 19, scale = 4)
    private BigDecimal materialCost;

    @Column(name = "labor_cost", nullable = false, precision = 19, scale = 4)
    private BigDecimal laborCost;

    @Column(name = "overhead_cost", nullable = false, precision = 19, scale = 4)
    private BigDecimal overheadCost;

    @Column(name = "total_cost", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalCost;

    @Column(nullable = false)
    private String currency;

    private String notes;

    @Column(name = "sales_order_id")
    private UUID salesOrderId;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<WorkOrderStepJpaEntity> steps = new ArrayList<>();

    public void addStep(WorkOrderStepJpaEntity step) {
        steps.add(step);
        step.setWorkOrder(this);
    }
}
