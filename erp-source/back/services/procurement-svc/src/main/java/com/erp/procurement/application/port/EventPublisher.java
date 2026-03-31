package com.erp.procurement.application.port;

import com.erp.procurement.domain.event.DomainEvent;

public interface EventPublisher {

    void publish(DomainEvent event, String topic);
}
