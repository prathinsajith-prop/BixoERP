package com.erp.procurement.api.controller;

import com.erp.procurement.api.dto.CreateVendorRequest;
import com.erp.procurement.domain.entity.Vendor;
import com.erp.procurement.domain.repository.VendorRepository;
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
@RequestMapping("/vendors")
@RequiredArgsConstructor
@Tag(name = "Vendors", description = "Vendor management")
public class VendorController {

    private final VendorRepository vendorRepository;

    @PostMapping
    @Operation(summary = "Create a new vendor")
    public ResponseEntity<VendorResponse> create(
            @Valid @RequestBody CreateVendorRequest request,
            Authentication authentication) {
        UUID tenantId = getTenantId(authentication);

        vendorRepository.findByCode(request.getCode(), tenantId).ifPresent(v -> {
            throw new IllegalArgumentException("Vendor code already exists: " + request.getCode());
        });

        Vendor vendor = Vendor.create(
                tenantId, request.getCode(), request.getName(), request.getTaxId(),
                request.getEmail(), request.getPhone(), request.getAddress(),
                request.getCity(), request.getCountry(), request.getPaymentTerms(),
                request.getCurrency());

        Vendor saved = vendorRepository.save(vendor);
        return ResponseEntity.status(HttpStatus.CREATED).body(VendorResponse.from(saved));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get vendor by ID")
    public ResponseEntity<VendorResponse> getById(
            @PathVariable UUID id, Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        Vendor vendor = vendorRepository.findById(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + id));
        return ResponseEntity.ok(VendorResponse.from(vendor));
    }

    @GetMapping
    @Operation(summary = "List vendors")
    public ResponseEntity<List<VendorResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        List<VendorResponse> vendors = vendorRepository.findByTenantId(tenantId, page, size)
                .stream().map(VendorResponse::from).toList();
        return ResponseEntity.ok(vendors);
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a vendor")
    public ResponseEntity<VendorResponse> deactivate(
            @PathVariable UUID id, Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        Vendor vendor = vendorRepository.findById(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + id));
        vendor.deactivate();
        Vendor saved = vendorRepository.save(vendor);
        return ResponseEntity.ok(VendorResponse.from(saved));
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate a vendor")
    public ResponseEntity<VendorResponse> activate(
            @PathVariable UUID id, Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        Vendor vendor = vendorRepository.findById(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + id));
        vendor.activate();
        Vendor saved = vendorRepository.save(vendor);
        return ResponseEntity.ok(VendorResponse.from(saved));
    }

    @SuppressWarnings("unchecked")
    private UUID getTenantId(Authentication authentication) {
        Map<String, Object> details = (Map<String, Object>) authentication.getDetails();
        return (UUID) details.get("tenant_id");
    }

    public record VendorResponse(UUID id, String code, String name, String taxId,
                                  String email, String phone, String address, String city,
                                  String country, int paymentTerms, String currency,
                                  boolean active) {
        public static VendorResponse from(Vendor v) {
            return new VendorResponse(v.getId(), v.getCode(), v.getName(), v.getTaxId(),
                    v.getEmail(), v.getPhone(), v.getAddress(), v.getCity(),
                    v.getCountry(), v.getPaymentTerms(), v.getCurrency(), v.isActive());
        }
    }
}
