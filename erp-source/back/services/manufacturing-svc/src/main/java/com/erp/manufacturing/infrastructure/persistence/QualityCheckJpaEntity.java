package com.erp.manufacturing.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "quality_checks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QualityCheckJpaEntity {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "work_order_id", nullable = false)
    private UUID workOrderId;

    @Column(name = "check_number", nullable = false)
    private String checkNumber;

    @Column(name = "step_id")
    private UUID stepId;

    @Column(name = "inspector_id", nullable = false)
    private UUID inspectorId;

    @Column(nullable = false)
    private String result;

    @Column(name = "sample_size", nullable = false)
    private int sampleSize;

    @Column(name = "defect_count", nullable = false)
    private int defectCount;

    @Column(columnDefinition = "TEXT")
    private String parameters;

    private String notes;

    @Column(name = "checked_at", nullable = false)
    private Instant checkedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
