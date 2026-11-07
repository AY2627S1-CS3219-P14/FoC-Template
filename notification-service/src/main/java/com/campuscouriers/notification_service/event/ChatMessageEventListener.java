package com.campuscouriers.notification_service.event;

import com.campuscouriers.notification_service.notification.NotificationService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class ChatMessageEventListener {
    private final ChatMessageEventParser parser;
    private final NotificationService notifications;

    public ChatMessageEventListener(ChatMessageEventParser parser,
                                    NotificationService notifications) {
        this.parser = parser;
        this.notifications = notifications;
    }

    @KafkaListener(topics = "chat.message.created")
    public void onEvent(ConsumerRecord<String, String> record) {
        ChatMessageEvent event = parser.parse(record);
        notifications.save(event.eventId(), event.recipientId(), "CHAT_MESSAGE",
            event.errandId(), event.conversationId(), "You received a new delivery message.");
    }
}

