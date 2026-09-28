package com.campuscouriers.supplier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBuildingRequest(
        @NotBlank(message = "Building name is required")
        @Size(max = 60, message = "Building name must not exceed 60 characters")
        String name
) {
}
