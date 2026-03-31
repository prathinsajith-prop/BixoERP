package com.erp.manufacturing.application.port;

import com.erp.manufacturing.domain.event.DomainEvent;

public interface EventPublisher {

    void publish(DomainEvent event, String topic);
}
