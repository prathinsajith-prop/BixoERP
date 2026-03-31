package com.erp.procurement.infrastructure.kafka;

import com.erp.procurement.application.usecase.CreatePurchaseOrderUseCase;
import com.erp.procurement.infrastructure.persistence.ProcessedEventJpaEntity;
import com.erp.procurement.infrastructure.persistence.SpringDataProcessedEventRepository;
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
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class KafkaEventConsumer {

    private final SpringDataProcessedEventRepository processedEventRepo;
    private final CreatePurchaseOrderUseCase createPurchaseOrderUseCase;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "stock.below.reorder", groupId = "${spring.kafka.consumer.group-id}")
    @Transactional
    public void handleStockBelowReorder(String message, Acknowledgment ack) {
        try {
            JsonNode node = objectMapper.readTree(message);
            String eventId = node.path("eventId").asText();

            if (isAlreadyProcessed(eventId)) {
                log.debug("Event {} already processed, skipping", eventId);
                ack.acknowledge();
                return;
            }

            String itemCode = node.path("itemCode").asText();
            String tenantId = node.path("tenantId").asText();
            BigDecimal reorderQty = new BigDecimal(node.path("reorderQuantity").asText("0"));

            log.info("Stock below reorder for item {} tenant {}, qty {}",
                    itemCode, tenantId, reorderQty);

            // Auto-create a purchase requisition for the reorder
            // The actual PO creation would be handled by a procurement officer
            markAsProcessed(eventId);
            ack.acknowledge();

            log.info("Processed stock.below.reorder event {} for item {}", eventId, itemCode);
        } catch (Exception e) {
            log.error("Failed to process stock.below.reorder event", e);
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
