package com.erp.manufacturing.infrastructure.kafka;

import com.erp.manufacturing.application.usecase.CreateWorkOrderUseCase;
import com.erp.manufacturing.domain.entity.BillOfMaterials;
import com.erp.manufacturing.domain.repository.BomRepository;
import com.erp.manufacturing.infrastructure.persistence.ProcessedEventJpaEntity;
import com.erp.manufacturing.infrastructure.persistence.SpringDataProcessedEventRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class KafkaEventConsumer {

    private final SpringDataProcessedEventRepository processedEventRepo;
    private final BomRepository bomRepository;
    private final CreateWorkOrderUseCase createWorkOrderUseCase;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "sales.order.confirmed", groupId = "${spring.kafka.consumer.group-id}")
    @Transactional
    public void handleSalesOrderConfirmed(String message, Acknowledgment ack) {
        try {
            JsonNode node = objectMapper.readTree(message);
            String eventId = node.path("eventId").asText();

            if (isAlreadyProcessed(eventId)) {
                log.debug("Event {} already processed, skipping", eventId);
                ack.acknowledge();
                return;
            }

            String tenantId = node.path("tenantId").asText();
            String productId = node.path("productId").asText();
            String quantity = node.path("quantity").asText("1");
            String salesOrderId = node.path("aggregateId").asText();

            log.info("Sales order confirmed for product {} tenant {}, qty {}",
                    productId, tenantId, quantity);

            // Look up the active BOM for this product and auto-create a work order
            UUID tenantUuid = UUID.fromString(tenantId);
            UUID productUuid = UUID.fromString(productId);

            bomRepository.findActiveByProductId(productUuid, tenantUuid)
                    .ifPresentOrElse(
                            bom -> {
                                createWorkOrderUseCase.execute(
                                        tenantUuid, bom.getId(), new BigDecimal(quantity), 5,
                                        "USD", "Auto-created from sales order " + salesOrderId,
                                        UUID.fromString(salesOrderId),
                                        tenantUuid, // system-created, use tenant as creator
                                        Collections.emptyList()
                                );
                                log.info("Auto-created work order for product {} from sales order {}",
                                        productId, salesOrderId);
                            },
                            () -> log.warn("No active BOM found for product {} tenant {}, cannot auto-create WO",
                                    productId, tenantId)
                    );

            markAsProcessed(eventId);
            ack.acknowledge();
        } catch (Exception e) {
            log.error("Failed to process sales.order.confirmed event", e);
            throw new RuntimeException("Event processing failed", e);
        }
    }

    private boolean isAlreadyProcessed(String eventId) {
        return processedEventRepo.existsById(eventId);
    }

    private void markAsProcessed(String eventId) {
        ProcessedEventJpaEntity entity = ProcessedEventJpaEntity.builder()
                .eventId(eventId)
                .processedAt(Instant.now())
                .build();
        processedEventRepo.save(entity);
    }
}
