package com.campuscouriers.supplier.importer;

import com.campuscouriers.supplier.entity.Building;
import com.campuscouriers.supplier.entity.BuildingStatus;
import com.campuscouriers.supplier.entity.Category;
import com.campuscouriers.supplier.entity.CategoryStatus;
import com.campuscouriers.supplier.entity.Supplier;
import com.campuscouriers.supplier.repository.BuildingRepository;
import com.campuscouriers.supplier.repository.CategoryRepository;
import com.campuscouriers.supplier.repository.SupplierRepository;
import com.campuscouriers.supplier.util.NameNormalizer;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class SupplierSeedImporter {
    private final SupplierSeedCsvReader csvReader;
    private final SupplierRepository supplierRepository;
    private final CategoryRepository categoryRepository;
    private final BuildingRepository buildingRepository;

    public SupplierSeedImporter(SupplierSeedCsvReader csvReader,
                                SupplierRepository supplierRepository,
                                CategoryRepository categoryRepository,
                                BuildingRepository buildingRepository) {
        this.csvReader = csvReader;
        this.supplierRepository = supplierRepository;
        this.categoryRepository = categoryRepository;
        this.buildingRepository = buildingRepository;
    }

    @Transactional
    public SupplierSeedImportSummary importFrom(Resource resource) {
        var rows = csvReader.read(resource);
        int suppliersCreated = 0;
        int suppliersSkipped = 0;
        int categoriesCreated = 0;
        int buildingsCreated = 0;

        for (SupplierSeedRow row : rows) {
            Resolved<Category> category = resolveCategory(row);
            Resolved<Building> building = resolveBuilding(row);
            categoriesCreated += category.created() ? 1 : 0;
            buildingsCreated += building.created() ? 1 : 0;

            String normalizedSupplier = NameNormalizer.normalizedName(row.name());
            if (supplierRepository.existsByNormalizedNameAndBuildingId(
                    normalizedSupplier, building.value().getId())) {
                suppliersSkipped++;
                continue;
            }

            String normalizedFloor = row.floor() == null
                    ? "" : row.floor().toLowerCase(Locale.ROOT);
            supplierRepository.save(new Supplier(
                    row.name(), normalizedSupplier, category.value(), building.value(),
                    row.floor(), normalizedFloor, row.description(), row.openingTime(),
                    row.closingTime(), row.imageUrl()));
            suppliersCreated++;
        }

        supplierRepository.flush();
        categoryRepository.flush();
        buildingRepository.flush();
        return new SupplierSeedImportSummary(rows.size(), suppliersCreated, suppliersSkipped,
                categoriesCreated, buildingsCreated);
    }

    private Resolved<Category> resolveCategory(SupplierSeedRow row) {
        String normalized = NameNormalizer.normalizedName(row.categoryName());
        return categoryRepository.findByNormalizedName(normalized)
                .map(category -> {
                    if (category.getStatus() != CategoryStatus.ACTIVE) {
                        throw new SupplierSeedImportException(row.rowNumber(),
                                "category '" + row.categoryName() + "' is retired");
                    }
                    return new Resolved<>(category, false);
                })
                .orElseGet(() -> new Resolved<>(categoryRepository.save(
                        new Category(row.categoryName(), normalized)), true));
    }

    private Resolved<Building> resolveBuilding(SupplierSeedRow row) {
        String displayName = NameNormalizer.displayName(row.buildingName());
        String normalized = NameNormalizer.normalizedName(displayName);
        return buildingRepository.findByNormalizedName(normalized)
                .map(building -> {
                    if (building.getStatus() != BuildingStatus.ACTIVE) {
                        throw new SupplierSeedImportException(row.rowNumber(),
                                "building '" + displayName + "' is retired");
                    }
                    return new Resolved<>(building, false);
                })
                .orElseGet(() -> new Resolved<>(buildingRepository.save(
                        new Building(displayName, normalized)), true));
    }

    private record Resolved<T>(T value, boolean created) {
    }
}
