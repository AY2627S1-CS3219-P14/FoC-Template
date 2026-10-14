package com.campuscouriers.user.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

// Publishes user lifecycle events, keyed by user id so each user's events stay ordered on one partition.
// Events are sent after the database commit, so a broker failure is logged rather than failing the request;
// such an event is lost (a transactional outbox would close this gap).
@Component
public class UserEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(UserEventPublisher.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String userRegisteredTopic;

    public UserEventPublisher(
        KafkaTemplate<String, Object> kafkaTemplate,
        @Value("${app.kafka.topics.user-registered}") String userRegisteredTopic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.userRegisteredTopic = userRegisteredTopic;
    }

    public void publishUserRegistered(UserRegisteredEvent event) {
        publish(userRegisteredTopic, event.userId().toString(), event);
    }

    private void publish(String topic, String key, Object event) {
        try {
            kafkaTemplate.send(topic, key, event).whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Failed to publish {} for key {} to {}", event.getClass().getSimpleName(), key, topic, ex);
                }
            });
        } catch (RuntimeException ex) {  // e.g. metadata timeout when the broker is unreachable
            log.error("Failed to publish {} for key {} to {}", event.getClass().getSimpleName(), key, topic, ex);
        }
    }

}
