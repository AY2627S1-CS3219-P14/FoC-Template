package com.campuscouriers.user.event;

import com.campuscouriers.user.entity.AccountType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.KafkaException;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static com.campuscouriers.user.TestConstants.VALID_EMAIL;
import static com.campuscouriers.user.TestConstants.VALID_NAME;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserEventPublisherTest {

    private static final String TOPIC = "user.registered";

    @Mock private KafkaTemplate<String, Object> kafkaTemplate;

    private UserEventPublisher publisher;

    private final UserRegisteredEvent event = new UserRegisteredEvent(
            UUID.randomUUID(), AccountType.Student, VALID_NAME, VALID_EMAIL, Instant.parse("2026-01-01T00:00:00Z"));

    @BeforeEach
    void setUp() {
        publisher = new UserEventPublisher(kafkaTemplate, TOPIC);
    }

    @Test
    void publishUserRegistered_sendsToTopicKeyedByUserId() {
        when(kafkaTemplate.send(anyString(), anyString(), any())).thenReturn(new CompletableFuture<>());

        publisher.publishUserRegistered(event);

        verify(kafkaTemplate).send(TOPIC, event.userId().toString(), event);
    }

    @Test
    void publishUserRegistered_whenSendFailsAsynchronously_doesNotThrow() {
        when(kafkaTemplate.send(anyString(), anyString(), any()))
                .thenReturn(CompletableFuture.failedFuture(new KafkaException("broker unavailable")));

        assertThatCode(() -> publisher.publishUserRegistered(event)).doesNotThrowAnyException();
    }

    @Test
    void publishUserRegistered_whenSendFailsSynchronously_doesNotThrow() {
        when(kafkaTemplate.send(anyString(), anyString(), any()))
                .thenThrow(new KafkaException("metadata timeout"));

        assertThatCode(() -> publisher.publishUserRegistered(event)).doesNotThrowAnyException();
    }

}
