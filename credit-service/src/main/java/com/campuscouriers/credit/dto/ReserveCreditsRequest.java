package com.campuscouriers.credit.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record ReserveCreditsRequest(
        @NotNull UUID userId,
        @NotNull UUID orderId, 
        @Positive long amount
) {
}