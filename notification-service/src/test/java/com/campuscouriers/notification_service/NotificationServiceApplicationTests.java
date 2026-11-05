package com.campuscouriers.notification_service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import com.campuscouriers.notification_service.notification.Notification;
import com.campuscouriers.notification_service.notification.NotificationRepository;
import com.campuscouriers.notification_service.notification.NotificationService;
import org.apache.kafka.clients.admin.Admin;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.KafkaContainer;
import org.testcontainers.postgresql.PostgreSQLContainer;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Testcontainers
class NotificationServiceApplicationTests {
    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");
    @Container
    static final KafkaContainer KAFKA = new KafkaContainer("apache/kafka:4.3.1");

    @DynamicPropertySource
    static void connections(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.kafka.bootstrap-servers", KAFKA::getBootstrapServers);
    }

    @Autowired KafkaTemplate<String, String> kafka;
    @Autowired NotificationRepository repository;
    @Autowired NotificationService notifications;
    @Autowired JdbcTemplate jdbc;

    @Test
    void mapsAllTopicsToTheOtherParticipantAndCommitsOffsets() throws Exception {
        for (String topic : List.of("errand.accepted", "errand.completed", "errand.failed")) {
            UUID eventId = UUID.randomUUID();
            UUID requester = UUID.randomUUID();
            UUID courier = UUID.randomUUID();
            UUID errand = UUID.randomUUID();
            var result = kafka.send(record(topic, eventId,
                payload(errand, requester, courier))).get(10, TimeUnit.SECONDS);
            await().atMost(Duration.ofSeconds(30)).untilAsserted(() -> {
                Notification saved = find(eventId);
                assertThat(saved.getRecipientId()).isEqualTo(
                    topic.equals("errand.accepted") ? requester : courier);
                assertThat(saved.getErrandId()).isEqualTo(errand);
                assertThat(saved.getType()).isEqualTo(topic.replace('.', '_').toUpperCase());
                assertThat(saved.getReadAt()).isNull();
                if (topic.equals("errand.completed")) {
                    assertThat(saved.getMessage())
                        .isEqualTo("The requester confirmed your errand is complete.")
                        .doesNotContain("earned", "paid", "credits");
                }
            });
            assertCommitted(topic, result.getRecordMetadata().partition(),
                result.getRecordMetadata().offset());
        }
    }

    @Test
    void kafkaRedeliveryDoesNotDuplicateNotifications() throws Exception {
        UUID eventId = UUID.randomUUID();
        String body = payload(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());
        kafka.send(record("errand.accepted", eventId, body)).get(10, TimeUnit.SECONDS);
        var last = kafka.send(record("errand.accepted", eventId, body)).get(10, TimeUnit.SECONDS);
        assertCommitted("errand.accepted", last.getRecordMetadata().partition(),
            last.getRecordMetadata().offset());
        assertThat(repository.findAll().stream().filter(n -> n.getSourceEventId().equals(eventId)))
            .hasSize(1);
    }

    @Test
    void concurrentInsertsDeduplicateWithoutBlockingOtherRecipients() {
        UUID event = UUID.randomUUID();
        UUID recipient = UUID.randomUUID();
        UUID errand = UUID.randomUUID();
        CompletableFuture<?>[] saves = new CompletableFuture<?>[8];
        for (int i = 0; i < saves.length; i++) {
            saves[i] = CompletableFuture.runAsync(() ->
                notifications.save(event, recipient, "ERRAND_ACCEPTED", errand, "Accepted"));
        }
        CompletableFuture.allOf(saves).join();
        assertThat(repository.findAll().stream().filter(n -> n.getSourceEventId().equals(event)))
            .hasSize(1);
        assertThat(notifications.save(event, UUID.randomUUID(), "ERRAND_ACCEPTED", errand, "Accepted"))
            .isTrue();
    }

    @Test
    void nonDuplicateDatabaseErrorsAreNotSwallowed() {
        assertThatThrownBy(() -> notifications.save(UUID.randomUUID(), null,
            "ERRAND_ACCEPTED", UUID.randomUUID(), "Accepted"))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void invalidEventsGoToDeadLetterTopicAndDoNotBlockFollowingEvents() throws Exception {
        String valid = payload(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());
        var missingHeader = new ProducerRecord<String, String>("errand.accepted", "key", valid);
        assertDeadLetter(missingHeader);
        assertDeadLetter(record("errand.accepted", UUID.randomUUID(), "{broken"));
        assertDeadLetter(record("errand.accepted", UUID.randomUUID(), "{}"));
        assertDeadLetter(record("errand.accepted", UUID.randomUUID(), null));
        assertDeadLetter(record("errand.accepted", UUID.randomUUID(), valid.replace("10", "-1")));
        UUID healthy = UUID.randomUUID();
        kafka.send(record("errand.accepted", healthy, valid)).get(10, TimeUnit.SECONDS);
        await().atMost(Duration.ofSeconds(20)).untilAsserted(() -> assertThat(find(healthy)).isNotNull());
    }

    @Test
    void temporaryDatabaseFailureRetriesAndSaves() throws Exception {
        UUID recipient = UUID.randomUUID();
        UUID event = UUID.randomUUID();
        jdbc.execute("CREATE SEQUENCE transient_attempts");
        jdbc.execute("""
            CREATE FUNCTION transient_failure() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                IF NEW.recipient_id = '%s'::uuid AND nextval('transient_attempts') = 1 THEN
                    RAISE EXCEPTION 'Simulated transient database failure' USING ERRCODE = '08006';
                END IF;
                RETURN NEW;
            END $$
            """.formatted(recipient));
        jdbc.execute("CREATE TRIGGER transient_failure BEFORE INSERT ON notifications "
            + "FOR EACH ROW EXECUTE FUNCTION transient_failure()");
        try {
            var sent = kafka.send(record("errand.accepted", event,
                payload(UUID.randomUUID(), recipient, UUID.randomUUID()))).get(10, TimeUnit.SECONDS);
            await().atMost(Duration.ofSeconds(30)).untilAsserted(() -> assertThat(find(event)).isNotNull());
            assertCommitted("errand.accepted", sent.getRecordMetadata().partition(),
                sent.getRecordMetadata().offset());
            assertThat(jdbc.queryForObject("SELECT last_value FROM transient_attempts", Long.class))
                .isEqualTo(2L);
        } finally {
            jdbc.execute("DROP TRIGGER transient_failure ON notifications");
            jdbc.execute("DROP FUNCTION transient_failure()");
            jdbc.execute("DROP SEQUENCE transient_attempts");
        }
    }

    @Test
    void repeatedDatabaseFailuresReachDeadLetterTopic() throws Exception {
        UUID recipient = UUID.randomUUID();
        jdbc.execute("CREATE SEQUENCE persistent_attempts");
        jdbc.execute("""
            CREATE FUNCTION persistent_failure() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                IF NEW.recipient_id = '%s'::uuid THEN
                    PERFORM nextval('persistent_attempts');
                    RAISE EXCEPTION 'Simulated persistent failure';
                END IF;
                RETURN NEW;
            END $$
            """.formatted(recipient));
        jdbc.execute("CREATE TRIGGER persistent_failure BEFORE INSERT ON notifications "
            + "FOR EACH ROW EXECUTE FUNCTION persistent_failure()");
        try {
            UUID event = UUID.randomUUID();
            assertDeadLetter(record("errand.accepted", event,
                payload(UUID.randomUUID(), recipient, UUID.randomUUID())));
            assertThat(repository.findAll().stream().filter(n -> n.getSourceEventId().equals(event)))
                .isEmpty();
            assertThat(jdbc.queryForObject("SELECT last_value FROM persistent_attempts", Long.class))
                .isEqualTo(3L);
        } finally {
            jdbc.execute("DROP TRIGGER persistent_failure ON notifications");
            jdbc.execute("DROP FUNCTION persistent_failure()");
            jdbc.execute("DROP SEQUENCE persistent_attempts");
        }
    }

    private Notification find(UUID eventId) {
        var result = repository.findAll().stream().filter(n -> n.getSourceEventId().equals(eventId))
            .findFirst();
        assertThat(result).as("notification for event %s", eventId).isPresent();
        return result.orElseThrow();
    }

    private void assertCommitted(String topic, int partition, long offset) throws Exception {
        try (Admin admin = Admin.create(Map.of("bootstrap.servers", KAFKA.getBootstrapServers()))) {
            await().atMost(Duration.ofSeconds(30)).untilAsserted(() -> {
                var committed = admin.listConsumerGroupOffsets("notification-service")
                    .partitionsToOffsetAndMetadata().get(5, TimeUnit.SECONDS)
                    .get(new TopicPartition(topic, partition));
                assertThat(committed).isNotNull();
                assertThat(committed.offset()).isGreaterThan(offset);
            });
        }
    }

    private void assertDeadLetter(ProducerRecord<String, String> original) throws Exception {
        try (var consumer = new KafkaConsumer<String, String>(Map.of(
                ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, KAFKA.getBootstrapServers(),
                ConsumerConfig.GROUP_ID_CONFIG, UUID.randomUUID().toString(),
                ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest",
                ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false),
                new StringDeserializer(), new StringDeserializer())) {
            // A unique key distinguishes this event from other DLT test records.
            var source = new ProducerRecord<String, String>(original.topic(), UUID.randomUUID().toString(),
                original.value());
            original.headers().forEach(source.headers()::add);
            var sent = kafka.send(source).get(10, TimeUnit.SECONDS);
            consumer.subscribe(List.of(original.topic() + ".notification-dlt"));
            await().atMost(Duration.ofSeconds(30)).untilAsserted(() -> {
                var records = consumer.poll(Duration.ofMillis(300));
                assertThat(records).anySatisfy(record -> {
                    assertThat(record.key()).isEqualTo(source.key());
                    assertThat(record.value()).isEqualTo(source.value());
                    assertThat(record.headers().lastHeader("kafka_dlt-exception-fqcn")).isNotNull();
                });
            });
            assertCommitted(source.topic(), sent.getRecordMetadata().partition(),
                sent.getRecordMetadata().offset());
        }
    }

    private ProducerRecord<String, String> record(String topic, UUID event, String body) {
        var record = new ProducerRecord<String, String>(topic, "errand-key", body);
        record.headers().add("eventId", event.toString().getBytes(StandardCharsets.UTF_8));
        return record;
    }

    private String payload(UUID errand, UUID requester, UUID courier) {
        return """
            {"errandId":"%s","requesterId":"%s","courierId":"%s","creditValue":10,
             "unknownFutureField":"ignored"}
            """.formatted(errand, requester, courier);
    }
}
