package com.campuscouriers.notification_service.notification;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/notifications")
public class NotificationController {
    private final NotificationRepository repository;
    private final NotificationStreams streams;

    public NotificationController(NotificationRepository repository, NotificationStreams streams) {
        this.repository = repository;
        this.streams = streams;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> stream(@AuthenticationPrincipal Jwt jwt) throws IOException {
        return ResponseEntity.ok()
            .header("Cache-Control", "no-store")
            .header("X-Accel-Buffering", "no")
            .body(streams.open(UUID.fromString(jwt.getSubject()), jwt.getExpiresAt()));
    }

    @GetMapping
    public HistoryResponse history(@AuthenticationPrincipal Jwt jwt,
                                   @RequestParam(defaultValue = "20") int limit) {
        if (limit < 1 || limit > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "limit must be between 1 and 100");
        }
        List<NotificationResponse> items = repository.findByRecipientIdOrderByCreatedAtDescIdDesc(
            UUID.fromString(jwt.getSubject()), PageRequest.of(0, limit)).stream()
            .map(NotificationResponse::from).toList();
        return new HistoryResponse(items);
    }

    public record HistoryResponse(List<NotificationResponse> items) {}
}
