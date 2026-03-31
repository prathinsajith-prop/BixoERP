package com.erp.manufacturing.api.controller;

import com.erp.manufacturing.api.dto.BomResponse;
import com.erp.manufacturing.api.dto.CreateBomRequest;
import com.erp.manufacturing.application.usecase.CreateBomUseCase;
import com.erp.manufacturing.domain.entity.BillOfMaterials;
import com.erp.manufacturing.domain.repository.BomRepository;
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
@RequestMapping("/boms")
@RequiredArgsConstructor
@Tag(name = "Bill of Materials", description = "BOM management")
public class BomController {

    private final CreateBomUseCase createBomUseCase;
    private final BomRepository bomRepository;

    @PostMapping
    @Operation(summary = "Create a new Bill of Materials")
    public ResponseEntity<BomResponse> create(
            @Valid @RequestBody CreateBomRequest request,
            Authentication authentication) {
        Map<String, Object> details = getAuthDetails(authentication);
        UUID tenantId = (UUID) details.get("tenant_id");
        UUID userId = (UUID) details.get("user_id");

        List<CreateBomUseCase.ComponentItem> components = request.getComponents().stream()
                .map(c -> new CreateBomUseCase.ComponentItem(
                        c.getComponentId(), c.getComponentName(), c.getQuantity(),
                        c.getUnit(), c.getUnitCost(), c.getCurrency()))
                .toList();

        BillOfMaterials bom = createBomUseCase.execute(
                tenantId, request.getProductId(), request.getProductName(),
                request.getNotes(), userId, components);

        return ResponseEntity.status(HttpStatus.CREATED).body(BomResponse.fromDomain(bom));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get BOM by ID")
    public ResponseEntity<BomResponse> getById(
            @PathVariable UUID id, Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        BillOfMaterials bom = bomRepository.findById(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("BOM not found: " + id));
        return ResponseEntity.ok(BomResponse.fromDomain(bom));
    }

    @GetMapping
    @Operation(summary = "List all BOMs")
    public ResponseEntity<List<BomResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        List<BomResponse> boms = bomRepository.findByTenantId(tenantId, page, size)
                .stream().map(BomResponse::fromDomain).toList();
        return ResponseEntity.ok(boms);
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get active BOM for a product")
    public ResponseEntity<BomResponse> getByProduct(
            @PathVariable UUID productId, Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        BillOfMaterials bom = bomRepository.findActiveByProductId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("No active BOM for product: " + productId));
        return ResponseEntity.ok(BomResponse.fromDomain(bom));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getAuthDetails(Authentication authentication) {
        return (Map<String, Object>) authentication.getDetails();
    }

    private UUID getTenantId(Authentication authentication) {
        return (UUID) getAuthDetails(authentication).get("tenant_id");
    }
}
