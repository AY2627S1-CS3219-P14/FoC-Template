package com.campuscouriers.notification_service.config;

import com.campuscouriers.notification_service.event.InvalidNotificationEventException;
import org.apache.kafka.common.TopicPartition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaConfig {
    @Bean
    KafkaAdmin.NewTopics notificationTopics() {
        // Match the existing outbox topics' three partitions, including their DLTs.
        return new KafkaAdmin.NewTopics(
            TopicBuilder.name("errand.accepted").partitions(3).replicas(1).build(),
            TopicBuilder.name("errand.delivered").partitions(3).replicas(1).build(),
            TopicBuilder.name("errand.completed").partitions(3).replicas(1).build(),
            TopicBuilder.name("errand.failed").partitions(3).replicas(1).build(),
            TopicBuilder.name("credit.received").partitions(3).replicas(1).build(),
            TopicBuilder.name("credit.released").partitions(3).replicas(1).build(),
            TopicBuilder.name("errand.accepted.notification-dlt").partitions(3).replicas(1).build(),
            TopicBuilder.name("errand.delivered.notification-dlt").partitions(3).replicas(1).build(),
            TopicBuilder.name("errand.completed.notification-dlt").partitions(3).replicas(1).build(),
            TopicBuilder.name("errand.failed.notification-dlt").partitions(3).replicas(1).build(),
            TopicBuilder.name("credit.received.notification-dlt").partitions(3).replicas(1).build(),
            TopicBuilder.name("credit.released.notification-dlt").partitions(3).replicas(1).build());
    }

    @Bean
    DefaultErrorHandler notificationErrorHandler(KafkaTemplate<String, String> template) {
        var recoverer = new DeadLetterPublishingRecoverer(template,
            (record, exception) -> new TopicPartition(
                record.topic() + ".notification-dlt", record.partition()));
        // Do not advance past a failed event unless Kafka confirms its DLT publication.
        recoverer.setFailIfSendResultIsError(true);
        var handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 2L));
        handler.addNotRetryableExceptions(InvalidNotificationEventException.class);
        return handler;
    }
}
