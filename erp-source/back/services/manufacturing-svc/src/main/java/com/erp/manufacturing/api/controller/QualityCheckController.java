package com.erp.manufacturing.api.controller;

import com.erp.manufacturing.api.dto.QualityCheckResponse;
import com.erp.manufacturing.api.dto.RecordQualityCheckRequest;
import com.erp.manufacturing.application.usecase.RecordQualityCheckUseCase;
import com.erp.manufacturing.domain.entity.QualityCheck;
import com.erp.manufacturing.domain.valueobject.QualityResult;
import com.erp.manufacturing.infrastructure.persistence.QualityCheckJpaEntity;
import com.erp.manufacturing.infrastructure.persistence.SpringDataQualityCheckRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/quality-checks")
@RequiredArgsConstructor
@Tag(name = "Quality Checks", description = "Quality control checks for work orders")
public class QualityCheckController {

    private final RecordQualityCheckUseCase recordQualityCheckUseCase;
    private final SpringDataQualityCheckRepository qualityCheckRepo;

    @PostMapping
    @Operation(summary = "Record a quality check")
    public ResponseEntity<QualityCheckResponse> record(
            @Valid @RequestBody RecordQualityCheckRequest request,
            Authentication authentication) {
        Map<String, Object> details = getAuthDetails(authentication);
        UUID tenantId = (UUID) details.get("tenant_id");
        UUID userId = (UUID) details.get("user_id");

        QualityResult result = QualityResult.valueOf(request.getResult().toUpperCase());

        QualityCheck qc = recordQualityCheckUseCase.execute(
                tenantId, request.getWorkOrderId(), request.getStepId(),
                userId, result, request.getSampleSize(),
                request.getDefectCount(), request.getParameters(), request.getNotes());

        return ResponseEntity.status(HttpStatus.CREATED).body(QualityCheckResponse.fromDomain(qc));
    }

    @GetMapping("/work-order/{workOrderId}")
    @Operation(summary = "List quality checks for a work order")
    public ResponseEntity<List<QualityCheckResponse>> listByWorkOrder(
            @PathVariable UUID workOrderId, Authentication authentication) {
        List<QualityCheckJpaEntity> entities = qualityCheckRepo.findByWorkOrderId(workOrderId);
        List<QualityCheckResponse> responses = entities.stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/work-order/{workOrderId}/failed")
    @Operation(summary = "List failed quality checks for a work order")
    public ResponseEntity<List<QualityCheckResponse>> listFailedByWorkOrder(
            @PathVariable UUID workOrderId, Authentication authentication) {
        List<QualityCheckJpaEntity> entities = qualityCheckRepo.findByWorkOrderIdAndResult(workOrderId, "FAIL");
        List<QualityCheckResponse> responses = entities.stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    private QualityCheckResponse toResponse(QualityCheckJpaEntity entity) {
        return QualityCheckResponse.builder()
                .id(entity.getId())
                .workOrderId(entity.getWorkOrderId())
                .checkNumber(entity.getCheckNumber())
                .stepId(entity.getStepId())
                .inspectorId(entity.getInspectorId())
                .result(entity.getResult())
                .sampleSize(entity.getSampleSize())
                .defectCount(entity.getDefectCount())
                .parameters(entity.getParameters())
                .notes(entity.getNotes())
                .checkedAt(entity.getCheckedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getAuthDetails(Authentication authentication) {
        return (Map<String, Object>) authentication.getDetails();
    }

    private UUID getTenantId(Authentication authentication) {
        return (UUID) getAuthDetails(authentication).get("tenant_id");
    }
}
