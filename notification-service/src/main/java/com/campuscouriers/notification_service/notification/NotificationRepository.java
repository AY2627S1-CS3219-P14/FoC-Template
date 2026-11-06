package com.campuscouriers.notification_service.notification;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByRecipientIdOrderByCreatedAtDescIdDesc(UUID recipientId, Pageable page);

    long countByRecipientIdAndReadAtIsNull(UUID recipientId);

    boolean existsByIdAndRecipientId(UUID id, UUID recipientId);

    @Modifying
    @Query("""
        update Notification n set n.readAt = :readAt
        where n.id = :id and n.recipientId = :recipientId and n.readAt is null
        """)
    int markRead(@Param("id") UUID id, @Param("recipientId") UUID recipientId,
                 @Param("readAt") Instant readAt);

    @Modifying
    @Query("""
        update Notification n set n.readAt = :readAt
        where n.recipientId = :recipientId and n.readAt is null
        """)
    int markAllRead(@Param("recipientId") UUID recipientId, @Param("readAt") Instant readAt);

    // A conflicting event is a no-op, including concurrent deliveries. Other SQL errors propagate.
    @Modifying
    @Query(value = """
        INSERT INTO notifications
            (id, recipient_id, source_event_id, type, errand_id, message, created_at)
        VALUES (:id, :recipientId, :eventId, :type, :errandId, :message, :createdAt)
        ON CONFLICT (source_event_id, recipient_id, type) DO NOTHING
        """, nativeQuery = true)
    int insertIfAbsent(@Param("id") UUID id,
                       @Param("recipientId") UUID recipientId,
                       @Param("eventId") UUID eventId,
                       @Param("type") String type,
                       @Param("errandId") UUID errandId,
                       @Param("message") String message,
                       @Param("createdAt") Instant createdAt);
}
