package com.campuscouriers.credit.dto;

import jakarta.validation.constraints.Positive;

public record AdjustReservationRequest(
        @Positive long newAmount
) {
}