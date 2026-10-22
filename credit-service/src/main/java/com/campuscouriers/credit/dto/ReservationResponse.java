package com.campuscouriers.credit.dto;

import com.campuscouriers.credit.entity.Reservation;
import com.campuscouriers.credit.entity.ReservationStatus;
import com.campuscouriers.credit.entity.Wallet;

import java.util.UUID;

public record ReservationResponse(
        UUID reservationId,
        UUID orderId,
        long amount,
        ReservationStatus status
) {
    public static ReservationResponse from(Reservation reservation, Wallet wallet) {
        return new ReservationResponse(
                reservation.getReservationId(),
                reservation.getOrderId(),
                reservation.getAmount(),
                reservation.getStatus()
        );
    }
}