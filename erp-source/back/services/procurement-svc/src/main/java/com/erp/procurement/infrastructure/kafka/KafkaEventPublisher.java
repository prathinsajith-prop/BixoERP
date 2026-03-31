package com.erp.procurement.infrastructure.kafka;

import com.erp.procurement.application.port.EventPublisher;
import com.erp.procurement.domain.event.DomainEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class KafkaEventPublisher implements EventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void publish(DomainEvent event, String topic) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(topic, event.getAggregateId().toString(), payload)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish event {} to topic {}", event.getEventType(), topic, ex);
                        } else {
                            log.debug("Published event {} to topic {} partition {} offset {}",
                                    event.getEventType(), topic,
                                    result.getRecordMetadata().partition(),
                                    result.getRecordMetadata().offset());
                        }
                    });
        } catch (Exception e) {
            log.error("Failed to serialize event {}", event.getEventType(), e);
            throw new RuntimeException("Event serialization failed", e);
        }
    }
}
