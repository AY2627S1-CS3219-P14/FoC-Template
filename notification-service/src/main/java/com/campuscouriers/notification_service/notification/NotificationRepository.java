package com.campuscouriers.notification_service.notification;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    // A conflicting event is a no-op, including concurrent deliveries. Other SQL errors propagate.
    @Modifying
    @Query(value = """
        INSERT INTO notifications
            (id, recipient_id, source_event_id, type, errand_id, message, created_at)
        VALUES (:id, :recipientId, :eventId, :type, :errandId, :message, CURRENT_TIMESTAMP)
        ON CONFLICT (source_event_id, recipient_id, type) DO NOTHING
        """, nativeQuery = true)
    int insertIfAbsent(@Param("id") UUID id,
                       @Param("recipientId") UUID recipientId,
                       @Param("eventId") UUID eventId,
                       @Param("type") String type,
                       @Param("errandId") UUID errandId,
                       @Param("message") String message);
}
