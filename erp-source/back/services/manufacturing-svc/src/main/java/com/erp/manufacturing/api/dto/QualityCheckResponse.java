package com.erp.manufacturing.api.dto;

import com.erp.manufacturing.domain.entity.QualityCheck;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class QualityCheckResponse {

    private UUID id;
    private UUID workOrderId;
    private String checkNumber;
    private UUID stepId;
    private UUID inspectorId;
    private String result;
    private int sampleSize;
    private int defectCount;
    private String parameters;
    private String notes;
    private Instant checkedAt;
    private Instant createdAt;

    public static QualityCheckResponse fromDomain(QualityCheck qc) {
        return QualityCheckResponse.builder()
                .id(qc.getId())
                .workOrderId(qc.getWorkOrderId())
                .checkNumber(qc.getCheckNumber())
                .stepId(qc.getStepId())
                .inspectorId(qc.getInspectorId())
                .result(qc.getResult().name())
                .sampleSize(qc.getSampleSize())
                .defectCount(qc.getDefectCount())
                .parameters(qc.getParameters())
                .notes(qc.getNotes())
                .checkedAt(qc.getCheckedAt())
                .createdAt(qc.getCreatedAt())
                .build();
    }
}
