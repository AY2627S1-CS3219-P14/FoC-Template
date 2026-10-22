package com.campuscouriers.credit.dto;
 
import jakarta.validation.constraints.NotNull;
 
import java.util.UUID;

public record CompleteReservationRequest(
        @NotNull UUID courierUserId,
        @NotNull UUID orderId
) {
}