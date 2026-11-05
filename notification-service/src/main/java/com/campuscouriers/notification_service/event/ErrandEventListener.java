package com.campuscouriers.notification_service.event;

import com.campuscouriers.notification_service.notification.NotificationService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class ErrandEventListener {
    private final ErrandEventParser parser;
    private final NotificationService notifications;

    public ErrandEventListener(ErrandEventParser parser, NotificationService notifications) {
        this.parser = parser;
        this.notifications = notifications;
    }

    @KafkaListener(topics = {"errand.accepted", "errand.completed", "errand.failed"})
    public void onEvent(ConsumerRecord<String, String> record) {
        ErrandEvent event = parser.parse(record);
        // Save commits before this listener returns; RECORD mode then commits the offset.
        switch (record.topic()) {
            case "errand.accepted" -> notifications.save(event.eventId(), event.requesterId(),
                "ERRAND_ACCEPTED", event.errandId(), "Someone has accepted your errand.");
            case "errand.completed" -> notifications.save(event.eventId(), event.courierId(),
                "ERRAND_COMPLETED", event.errandId(),
                "The requester confirmed your errand is complete.");
            case "errand.failed" -> notifications.save(event.eventId(), event.courierId(),
                "ERRAND_FAILED", event.errandId(), "The requester reported a failure with your errand.");
            default -> throw new InvalidErrandEventException("Unsupported event topic");
        }
    }
}
