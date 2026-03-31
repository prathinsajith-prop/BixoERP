package com.erp.procurement.api.controller;

import com.erp.procurement.api.dto.*;
import com.erp.procurement.application.usecase.ApprovePurchaseOrderUseCase;
import com.erp.procurement.application.usecase.CreatePurchaseOrderUseCase;
import com.erp.procurement.application.usecase.ReceiveGoodsUseCase;
import com.erp.procurement.domain.entity.GoodsReceipt;
import com.erp.procurement.domain.entity.PurchaseOrder;
import com.erp.procurement.domain.repository.PurchaseOrderRepository;
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
@RequestMapping("/purchase-orders")
@RequiredArgsConstructor
@Tag(name = "Purchase Orders", description = "Purchase Order management")
public class PurchaseOrderController {

    private final CreatePurchaseOrderUseCase createPurchaseOrderUseCase;
    private final ApprovePurchaseOrderUseCase approvePurchaseOrderUseCase;
    private final ReceiveGoodsUseCase receiveGoodsUseCase;
    private final PurchaseOrderRepository purchaseOrderRepository;

    @PostMapping
    @Operation(summary = "Create a new purchase order")
    public ResponseEntity<PurchaseOrderResponse> create(
            @Valid @RequestBody CreatePurchaseOrderRequest request,
            Authentication authentication) {
        Map<String, Object> details = getAuthDetails(authentication);
        UUID tenantId = (UUID) details.get("tenant_id");
        UUID userId = (UUID) details.get("user_id");

        List<CreatePurchaseOrderUseCase.LineItem> lines = request.getLines().stream()
                .map(l -> new CreatePurchaseOrderUseCase.LineItem(
                        l.getItemCode(), l.getDescription(), l.getQuantity(),
                        l.getUnitPrice(), l.getTaxRate()))
                .toList();

        PurchaseOrder po = createPurchaseOrderUseCase.execute(
                tenantId, request.getVendorId(), request.getCurrency(),
                request.getNotes(), request.getExpectedDate(), userId, lines);

        return ResponseEntity.status(HttpStatus.CREATED).body(PurchaseOrderResponse.fromDomain(po));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get purchase order by ID")
    public ResponseEntity<PurchaseOrderResponse> getById(
            @PathVariable UUID id, Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        PurchaseOrder po = purchaseOrderRepository.findById(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        return ResponseEntity.ok(PurchaseOrderResponse.fromDomain(po));
    }

    @GetMapping
    @Operation(summary = "List purchase orders")
    public ResponseEntity<List<PurchaseOrderResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        List<PurchaseOrderResponse> orders = purchaseOrderRepository.findByTenantId(tenantId, page, size)
                .stream().map(PurchaseOrderResponse::fromDomain).toList();
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit purchase order for approval")
    public ResponseEntity<PurchaseOrderResponse> submit(
            @PathVariable UUID id, Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        PurchaseOrder po = purchaseOrderRepository.findById(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        po.submitForApproval();
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return ResponseEntity.ok(PurchaseOrderResponse.fromDomain(saved));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve a purchase order")
    public ResponseEntity<PurchaseOrderResponse> approve(
            @PathVariable UUID id, Authentication authentication) {
        Map<String, Object> details = getAuthDetails(authentication);
        UUID tenantId = (UUID) details.get("tenant_id");
        UUID userId = (UUID) details.get("user_id");

        PurchaseOrder po = approvePurchaseOrderUseCase.execute(id, tenantId, userId);
        return ResponseEntity.ok(PurchaseOrderResponse.fromDomain(po));
    }

    @PostMapping("/{id}/send")
    @Operation(summary = "Send purchase order to vendor")
    public ResponseEntity<PurchaseOrderResponse> sendToVendor(
            @PathVariable UUID id, Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        PurchaseOrder po = purchaseOrderRepository.findById(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        po.sendToVendor();
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return ResponseEntity.ok(PurchaseOrderResponse.fromDomain(saved));
    }

    @PostMapping("/{id}/receive")
    @Operation(summary = "Receive goods for a purchase order (3-way match)")
    public ResponseEntity<Map<String, Object>> receiveGoods(
            @PathVariable UUID id,
            @Valid @RequestBody ReceiveGoodsRequest request,
            Authentication authentication) {
        Map<String, Object> details = getAuthDetails(authentication);
        UUID tenantId = (UUID) details.get("tenant_id");
        UUID userId = (UUID) details.get("user_id");

        List<ReceiveGoodsUseCase.ReceiptLine> receiptLines = request.getLines().stream()
                .map(l -> new ReceiveGoodsUseCase.ReceiptLine(
                        l.getPoLineId(), l.getQuantityReceived(),
                        l.isAccepted(), l.getRejectionReason()))
                .toList();

        GoodsReceipt receipt = receiveGoodsUseCase.execute(
                tenantId, id, userId, request.getNotes(), receiptLines);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "receiptId", receipt.getId(),
                "receiptNumber", receipt.getReceiptNumber(),
                "purchaseOrderId", receipt.getPurchaseOrderId()
        ));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel a purchase order")
    public ResponseEntity<PurchaseOrderResponse> cancel(
            @PathVariable UUID id, Authentication authentication) {
        UUID tenantId = getTenantId(authentication);
        PurchaseOrder po = purchaseOrderRepository.findById(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        po.cancel();
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return ResponseEntity.ok(PurchaseOrderResponse.fromDomain(saved));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getAuthDetails(Authentication authentication) {
        return (Map<String, Object>) authentication.getDetails();
    }

    private UUID getTenantId(Authentication authentication) {
        return (UUID) getAuthDetails(authentication).get("tenant_id");
    }
}
