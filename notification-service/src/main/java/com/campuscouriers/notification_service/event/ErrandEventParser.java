package com.campuscouriers.notification_service.event;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.header.Header;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Component
public class ErrandEventParser {
    private final JsonMapper mapper = JsonMapper.builder().build();

    public ErrandEvent parse(ConsumerRecord<String, String> record) {
        Header header = record.headers().lastHeader("eventId");
        if (header == null || header.value() == null) {
            throw new InvalidErrandEventException("Missing eventId header");
        }
        try {
            UUID eventId = uuid(new String(header.value(), StandardCharsets.UTF_8));
            if (record.value() == null) {
                throw new InvalidErrandEventException("Missing event payload");
            }
            JsonNode payload = mapper.readTree(record.value());
            if (payload == null || !payload.isObject()) {
                throw new InvalidErrandEventException("Expected a JSON object");
            }
            JsonNode credits = payload.get("creditValue");
            if (credits == null || !credits.isIntegralNumber()
                    || !credits.canConvertToLong() || credits.longValue() <= 0) {
                throw new InvalidErrandEventException("creditValue must be a positive integer");
            }
            return new ErrandEvent(eventId, uuidField(payload, "errandId"),
                uuidField(payload, "requesterId"), uuidField(payload, "courierId"),
                credits.longValue());
        } catch (InvalidErrandEventException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw new InvalidErrandEventException("Invalid errand event JSON or UUID");
        }
    }

    private UUID uuidField(JsonNode payload, String field) {
        JsonNode value = payload.get(field);
        if (value == null || !value.isString()) {
            throw new InvalidErrandEventException("Missing or invalid " + field);
        }
        return uuid(value.asString());
    }

    private UUID uuid(String value) {
        UUID parsed = UUID.fromString(value);
        if (!parsed.toString().equalsIgnoreCase(value)) {
            throw new InvalidErrandEventException("Expected canonical UUID");
        }
        return parsed;
    }
}
