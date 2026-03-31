package com.erp.manufacturing.application.usecase;

import com.erp.manufacturing.domain.entity.BillOfMaterials;
import com.erp.manufacturing.domain.repository.BomRepository;
import com.erp.manufacturing.infrastructure.persistence.OutboxEventJpaEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CreateBomUseCase {

    private final BomRepository bomRepository;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    @Transactional
    public BillOfMaterials execute(UUID tenantId, UUID productId, String productName,
                                   String notes, UUID createdBy, List<ComponentItem> components) {
        String bomNumber = generateBomNumber(tenantId);

        BillOfMaterials bom = BillOfMaterials.create(tenantId, bomNumber, productId,
                productName, notes, createdBy);

        for (ComponentItem item : components) {
            bom.addLine(item.componentId(), item.componentName(), item.quantity(),
                    item.unit(), item.unitCost(), item.currency());
        }

        BillOfMaterials saved = bomRepository.save(bom);

        log.info("Created BOM {} for product {} tenant {}", saved.getBomNumber(), productName, tenantId);
        return saved;
    }

    private String generateBomNumber(UUID tenantId) {
        long count = bomRepository.countByTenantId(tenantId);
        return "BOM-%06d".formatted(count + 1);
    }

    public record ComponentItem(UUID componentId, String componentName, BigDecimal quantity,
                                String unit, BigDecimal unitCost, String currency) {}
}
