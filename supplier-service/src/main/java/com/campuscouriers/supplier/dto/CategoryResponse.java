package com.campuscouriers.supplier.dto;

import com.campuscouriers.supplier.entity.Category;
import com.campuscouriers.supplier.entity.CategoryStatus;

import java.util.UUID;

public record CategoryResponse(UUID id, String name, CategoryStatus status) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getStatus());
    }
}
