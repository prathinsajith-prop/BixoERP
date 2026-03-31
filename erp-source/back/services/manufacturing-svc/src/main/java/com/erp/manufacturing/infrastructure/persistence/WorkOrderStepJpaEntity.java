package com.erp.manufacturing.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "work_order_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderStepJpaEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id", nullable = false)
    private WorkOrderJpaEntity workOrder;

    @Column(name = "step_number", nullable = false)
    private int stepNumber;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "machine_id")
    private UUID machineId;

    @Column(name = "machine_name")
    private String machineName;

    @Column(name = "estimated_hours", nullable = false, precision = 10, scale = 2)
    private BigDecimal estimatedHours;

    @Column(name = "actual_hours", precision = 10, scale = 2)
    private BigDecimal actualHours;

    @Column(nullable = false)
    private String status;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "completed_by")
    private UUID completedBy;

    private String notes;
}
