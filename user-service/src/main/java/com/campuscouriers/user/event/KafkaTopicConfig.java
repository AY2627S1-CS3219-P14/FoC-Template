package com.campuscouriers.user.event;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

// Topics owned by the user service; Spring's KafkaAdmin creates them on startup if missing
@Configuration
public class KafkaTopicConfig {

    private static final int PARTITIONS = 3;
    private static final int REPLICAS = 1;  // single broker

    @Bean
    NewTopic userRegisteredTopic(@Value("${app.kafka.topics.user-registered}") String name) {
        return TopicBuilder.name(name)
                .partitions(PARTITIONS)
                .replicas(REPLICAS)
                .build();
    }

}
