package com.campuscouriers.supplier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
        @NotBlank(message = "Category name is required")
        @Size(max = 60, message = "Category name must not exceed 60 characters")
        String name
) {
}
