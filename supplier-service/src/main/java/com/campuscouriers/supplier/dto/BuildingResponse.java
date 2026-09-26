package com.campuscouriers.supplier.dto;

import com.campuscouriers.supplier.entity.Building;
import com.campuscouriers.supplier.entity.BuildingStatus;

import java.util.UUID;

public record BuildingResponse(UUID id, String name, BuildingStatus status) {

    public static BuildingResponse from(Building building) {
        return new BuildingResponse(building.getId(), building.getName(), building.getStatus());
    }
}
