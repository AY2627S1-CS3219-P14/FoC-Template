package com.campuscouriers.supplier.importer;

import java.time.LocalTime;

public record SupplierSeedRow(
        long rowNumber,
        String name,
        String categoryName,
        String buildingName,
        String floor,
        String description,
        LocalTime openingTime,
        LocalTime closingTime,
        String imageUrl
) {
}
