package com.campuscouriers.notification_service.event;

import java.util.UUID;

public record ChatMessageEvent(UUID eventId, UUID messageId, UUID conversationId,
                               UUID errandId, UUID senderId, UUID recipientId,
                               long sequenceNumber) {
}

