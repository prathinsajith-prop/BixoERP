package com.erp.manufacturing.infrastructure.outbox;

import com.erp.manufacturing.infrastructure.persistence.OutboxEventJpaEntity;
import com.erp.manufacturing.infrastructure.persistence.SpringDataOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxRelay {

    private final SpringDataOutboxRepository outboxRepo;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${app.outbox.batch-size:50}")
    private int batchSize;

    @Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:5000}")
    @Transactional
    public void pollAndPublish() {
        List<OutboxEventJpaEntity> events = outboxRepo.findUnpublished(batchSize);

        if (events.isEmpty()) {
            return;
        }

        log.debug("Outbox relay: publishing {} events", events.size());

        for (OutboxEventJpaEntity event : events) {
            try {
                kafkaTemplate.send(event.getTopic(), event.getAggregateId().toString(), event.getPayload())
                        .whenComplete((result, ex) -> {
                            if (ex != null) {
                                log.error("Outbox relay: failed to publish event {} to topic {}",
                                        event.getId(), event.getTopic(), ex);
                            }
                        });

                event.setPublishedAt(Instant.now());
                outboxRepo.save(event);

                log.debug("Outbox relay: published event {} type {} to topic {}",
                        event.getId(), event.getEventType(), event.getTopic());
            } catch (Exception e) {
                log.error("Outbox relay: error publishing event {}", event.getId(), e);
                break;
            }
        }
    }
}
