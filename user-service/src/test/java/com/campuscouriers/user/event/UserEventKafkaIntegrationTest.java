package com.campuscouriers.user.event;

import com.campuscouriers.user.auth.AuthService;
import com.campuscouriers.user.auth.dto.RegisterRequest;
import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.exception.EmailAlreadyRegisteredException;
import com.campuscouriers.user.repository.AccountRepository;
import com.campuscouriers.user.repository.ProfileRepository;
import com.campuscouriers.user.repository.RefreshTokenRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.KafkaContainer;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.campuscouriers.user.TestConstants.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Runs against a real broker to check what other services actually receive: topic, key and the JSON on the wire.
// Add a @Nested class per event type; each reads its topic through recordsFor()/awaitRecord().
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class UserEventKafkaIntegrationTest {

    private static final Duration RECEIVE_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration QUIET_PERIOD = Duration.ofSeconds(2);

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Container
    static KafkaContainer kafka = new KafkaContainer("apache/kafka:4.3.1");  // same image as compose.yaml

    @DynamicPropertySource
    static void configureProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Autowired private AuthService authService;
    @Autowired private AccountRepository accountRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;

    @Value("${app.kafka.topics.user-registered}") private String userRegisteredTopic;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private KafkaConsumer<String, String> consumer;

    // A fresh group per test reading from the start of every topic; tests filter by key, so earlier records don't interfere
    @BeforeEach
    void createConsumer() {
        consumer = new KafkaConsumer<>(Map.of(
                ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers(),
                ConsumerConfig.GROUP_ID_CONFIG, "test-" + UUID.randomUUID(),
                ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest",
                ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class,
                ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class
        ));
        consumer.subscribe(List.of(userRegisteredTopic));
    }

    @AfterEach
    void cleanUp() {
        consumer.close();
        refreshTokenRepository.deleteAll();
        profileRepository.deleteAll();
        accountRepository.deleteAll();
    }

    @DisplayName("UserRegisteredEvent")
    @Nested
    class UserRegisteredEventTests {

        @Test
        void register_publishesEventKeyedByUserIdWithPlainJsonPayload() throws Exception {
            authService.register(new RegisterRequest(VALID_NAME, DUPLICATE_EMAIL, VALID_PASSWORD));
            Account account = accountRepository.findByEmail(VALID_EMAIL).orElseThrow();

            ConsumerRecord<String, String> record = awaitRecord(userRegisteredTopic, account.getId().toString());

            JsonNode payload = objectMapper.readTree(record.value());
            assertThat(payload.get("userId").asText()).isEqualTo(account.getId().toString());
            assertThat(payload.get("type").asText()).isEqualTo("Student");
            assertThat(payload.get("name").asText()).isEqualTo(VALID_NAME);
            assertThat(payload.get("email").asText()).isEqualTo(VALID_EMAIL);
            assertThat(Instant.parse(payload.get("registeredAt").asText())).isBeforeOrEqualTo(Instant.now());

            // Consumers deserialize into their own classes, so no Java type information is sent
            assertThat(record.headers().lastHeader("__TypeId__")).isNull();
        }

        @Test
        void register_withDuplicateEmail_publishesOnlyOnce() {
            authService.register(new RegisterRequest(VALID_NAME, VALID_EMAIL, VALID_PASSWORD));
            assertThatThrownBy(() -> authService.register(new RegisterRequest(VALID_NAME, VALID_EMAIL, VALID_PASSWORD)))
                    .isInstanceOf(EmailAlreadyRegisteredException.class);
            String key = accountRepository.findByEmail(VALID_EMAIL).orElseThrow().getId().toString();

            awaitRecord(userRegisteredTopic, key);
            assertThat(recordsFor(userRegisteredTopic, key, QUIET_PERIOD)).isEmpty();
        }
    }

    // ---- Helpers ----

    // Returns the first record on the topic with the given key, failing if none arrives in time
    private ConsumerRecord<String, String> awaitRecord(String topic, String key) {
        List<ConsumerRecord<String, String>> records = recordsFor(topic, key, RECEIVE_TIMEOUT, true);
        assertThat(records).as("record on %s with key %s", topic, key).isNotEmpty();
        return records.get(0);
    }

    // Collects every record on the topic with the given key that arrives within the window
    private List<ConsumerRecord<String, String>> recordsFor(String topic, String key, Duration window) {
        return recordsFor(topic, key, window, false);
    }

    private List<ConsumerRecord<String, String>> recordsFor(String topic, String key, Duration window, boolean stopAtFirst) {
        List<ConsumerRecord<String, String>> matches = new ArrayList<>();
        Instant deadline = Instant.now().plus(window);
        while (Instant.now().isBefore(deadline)) {
            for (ConsumerRecord<String, String> record : consumer.poll(Duration.ofMillis(250))) {
                if (record.topic().equals(topic) && key.equals(record.key())) {
                    matches.add(record);
                }
            }
            if (stopAtFirst && !matches.isEmpty()) {
                break;
            }
        }
        return matches;
    }

}
