package com.campuscouriers.supplier.importer;

public record SupplierSeedImportSummary(
        int totalRows,
        int createdSuppliers,
        int skippedSuppliers,
        int createdCategories,
        int createdBuildings
) {
}
