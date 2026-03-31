package com.erp.manufacturing.domain.entity;

import com.erp.manufacturing.domain.valueobject.QualityResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class QualityCheck {

    private UUID id;
    private UUID tenantId;
    private UUID workOrderId;
    private String checkNumber;
    private UUID stepId;
    private UUID inspectorId;
    private QualityResult result;
    private int sampleSize;
    private int defectCount;
    private String parameters;
    private String notes;
    private Instant checkedAt;
    private Instant createdAt;

    public static QualityCheck create(UUID tenantId, UUID workOrderId, String checkNumber,
                                      UUID stepId, UUID inspectorId, QualityResult result,
                                      int sampleSize, int defectCount, String parameters, String notes) {
        return QualityCheck.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .workOrderId(workOrderId)
                .checkNumber(checkNumber)
                .stepId(stepId)
                .inspectorId(inspectorId)
                .result(result)
                .sampleSize(sampleSize)
                .defectCount(defectCount)
                .parameters(parameters)
                .notes(notes)
                .checkedAt(Instant.now())
                .createdAt(Instant.now())
                .build();
    }

    public boolean isFailed() {
        return result.isFailed();
    }

    public boolean isPassed() {
        return result.isPassed();
    }
}
