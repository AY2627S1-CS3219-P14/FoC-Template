package com.campuscouriers.credit.repository;

import com.campuscouriers.credit.entity.Reservation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Reservation> findWithLockByReservationId(UUID reservationId);

    Optional<Reservation> findByOrderId(UUID orderId);
}