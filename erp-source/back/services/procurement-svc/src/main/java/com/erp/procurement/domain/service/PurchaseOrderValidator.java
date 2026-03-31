package com.erp.procurement.domain.service;

import com.erp.procurement.domain.entity.PurchaseOrder;
import com.erp.procurement.domain.entity.Vendor;
import com.erp.procurement.domain.repository.VendorRepository;
import com.erp.procurement.domain.valueobject.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PurchaseOrderValidator {

    private final VendorRepository vendorRepository;

    public void validateForCreation(PurchaseOrder po) {
        if (po.getTenantId() == null) {
            throw new IllegalArgumentException("Tenant ID is required");
        }
        if (po.getVendorId() == null) {
            throw new IllegalArgumentException("Vendor ID is required");
        }
        Vendor vendor = vendorRepository.findById(po.getVendorId(), po.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + po.getVendorId()));
        if (!vendor.isActive()) {
            throw new IllegalArgumentException("Vendor is inactive: " + vendor.getCode());
        }
        if (po.getCurrency() == null || po.getCurrency().length() != 3) {
            throw new IllegalArgumentException("Valid 3-letter currency code is required");
        }
    }

    public void validateForApproval(PurchaseOrder po) {
        if (po.getStatus() != OrderStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("PO must be in PENDING_APPROVAL status to approve");
        }
        if (po.getLines().isEmpty()) {
            throw new IllegalStateException("PO must have at least one line to approve");
        }
    }

    public void validateForSending(PurchaseOrder po) {
        if (po.getStatus() != OrderStatus.APPROVED) {
            throw new IllegalStateException("PO must be APPROVED before sending to vendor");
        }
    }
}
