package com.campuscouriers.notification_service.notification;

import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {
    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    // This proxy commits before returning to the Kafka listener.
    @Transactional
    public boolean save(UUID eventId, UUID recipientId, String type, UUID errandId, String message) {
        return repository.insertIfAbsent(UUID.randomUUID(), recipientId, eventId,
            type, errandId, message) == 1;
    }
}
