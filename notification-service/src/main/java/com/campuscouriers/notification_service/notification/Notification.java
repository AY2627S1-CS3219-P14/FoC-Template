package com.campuscouriers.notification_service.notification;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "notifications",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_notification_event_recipient_type",
        columnNames = {"source_event_id", "recipient_id", "type"}),
    indexes = @Index(name = "idx_notifications_recipient_created",
        columnList = "recipient_id, created_at DESC, id DESC"))
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "recipient_id", nullable = false)
    private UUID recipientId;

    @Column(name = "source_event_id", nullable = false)
    private UUID sourceEventId;

    @Column(nullable = false, length = 64)
    private String type;

    @Column(name = "errand_id", nullable = false)
    private UUID errandId;

    @Column(nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "read_at")
    private Instant readAt;

    protected Notification() {
        // Required by JPA.
    }

    public Notification(UUID recipientId, UUID sourceEventId, String type,
                        UUID errandId, String message) {
        this.recipientId = recipientId;
        this.sourceEventId = sourceEventId;
        this.type = type;
        this.errandId = errandId;
        this.message = message;
    }

    public UUID getId() { return id; }
    public UUID getRecipientId() { return recipientId; }
    public UUID getSourceEventId() { return sourceEventId; }
    public String getType() { return type; }
    public UUID getErrandId() { return errandId; }
    public String getMessage() { return message; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getReadAt() { return readAt; }
}
