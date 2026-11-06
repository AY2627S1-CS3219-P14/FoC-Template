package com.campuscouriers.notification_service.notification;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/notifications")
public class NotificationController {
    private final NotificationRepository repository;

    public NotificationController(NotificationRepository repository) {
        this.repository = repository;
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
