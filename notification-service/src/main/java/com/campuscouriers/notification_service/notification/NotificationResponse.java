package com.campuscouriers.notification_service.notification;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(UUID id, String type, UUID errandId, String message,
                                   Instant createdAt, Instant readAt) {
    static NotificationResponse from(Notification notification) {
        return new NotificationResponse(notification.getId(), notification.getType(),
            notification.getErrandId(), notification.getMessage(), notification.getCreatedAt(),
            notification.getReadAt());
    }
}
