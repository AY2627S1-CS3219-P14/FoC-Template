package com.campuscouriers.supplier.service;

import com.campuscouriers.supplier.dto.CreateSupplierRequest;
import com.campuscouriers.supplier.dto.SupplierResponse;
import com.campuscouriers.supplier.dto.PageMetadata;
import com.campuscouriers.supplier.dto.SupplierPageResponse;
import com.campuscouriers.supplier.entity.Building;
import com.campuscouriers.supplier.entity.BuildingStatus;
import com.campuscouriers.supplier.entity.Category;
import com.campuscouriers.supplier.entity.CategoryStatus;
import com.campuscouriers.supplier.entity.Supplier;
import com.campuscouriers.supplier.entity.SupplierStatus;
import com.campuscouriers.supplier.exception.DuplicateSupplierException;
import com.campuscouriers.supplier.exception.ReferenceNotActiveException;
import com.campuscouriers.supplier.exception.ReferenceNotFoundException;
import com.campuscouriers.supplier.exception.InvalidQueryParameterException;
import com.campuscouriers.supplier.repository.BuildingRepository;
import com.campuscouriers.supplier.repository.CategoryRepository;
import com.campuscouriers.supplier.repository.SupplierRepository;
import com.campuscouriers.supplier.repository.SupplierSpecifications;
import com.campuscouriers.supplier.util.NameNormalizer;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.util.Locale;
import java.util.UUID;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final CategoryRepository categoryRepository;
    private final BuildingRepository buildingRepository;

    public SupplierService(
            SupplierRepository supplierRepository,
            CategoryRepository categoryRepository,
            BuildingRepository buildingRepository
    ) {
        this.supplierRepository = supplierRepository;
        this.categoryRepository = categoryRepository;
        this.buildingRepository = buildingRepository;
    }

    @Transactional
    public SupplierResponse create(CreateSupplierRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ReferenceNotFoundException("Category", request.categoryId()));
        if (category.getStatus() != CategoryStatus.ACTIVE) {
            throw new ReferenceNotActiveException("Category");
        }

        Building building = buildingRepository.findById(request.buildingId())
                .orElseThrow(() -> new ReferenceNotFoundException("Building", request.buildingId()));
        if (building.getStatus() != BuildingStatus.ACTIVE) {
            throw new ReferenceNotActiveException("Building");
        }

        String displayName = NameNormalizer.displayName(request.name());
        String normalizedName = NameNormalizer.normalizedName(displayName);
        String floor = optionalDisplayValue(request.floor());
        String normalizedFloor = floor == null ? "" : floor.toLowerCase(Locale.ROOT);

        if (supplierRepository.existsByNormalizedNameAndBuildingId(
                normalizedName, building.getId())) {
            throw new DuplicateSupplierException(displayName);
        }

        Supplier supplier = new Supplier(
                displayName,
                normalizedName,
                category,
                building,
                floor,
                normalizedFloor,
                optionalDisplayValue(request.description()),
                request.openingTime(),
                request.closingTime(),
                optionalDisplayValue(request.imageUrl())
        );

        try {
            return SupplierResponse.from(supplierRepository.saveAndFlush(supplier));
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateSupplierException(displayName);
        }
    }

    @Transactional(readOnly = true)
    public SupplierPageResponse findActive(
            String query,
            UUID categoryId,
            UUID buildingId,
            int page,
            int size,
            String sort
    ) {
        validatePagination(page, size);
        Sort.Direction direction = parseSortDirection(sort);

        Specification<Supplier> specification = Specification
                .where(SupplierSpecifications.hasStatus(SupplierStatus.ACTIVE))
                .and(SupplierSpecifications.nameContains(query))
                .and(SupplierSpecifications.hasCategory(categoryId))
                .and(SupplierSpecifications.hasBuilding(buildingId));

        Page<Supplier> suppliers = supplierRepository.findAll(
                specification,
                PageRequest.of(page, size, Sort.by(direction, "normalizedName"))
        );

        return new SupplierPageResponse(
                suppliers.getContent().stream().map(SupplierResponse::from).toList(),
                PageMetadata.from(suppliers)
        );
    }

    private void validatePagination(int page, int size) {
        if (page < 0) {
            throw new InvalidQueryParameterException("Page must be zero or greater");
        }
        if (size < 1 || size > 100) {
            throw new InvalidQueryParameterException("Size must be between 1 and 100");
        }
    }

    private Sort.Direction parseSortDirection(String sort) {
        return switch (sort) {
            case "name,asc" -> Sort.Direction.ASC;
            case "name,desc" -> Sort.Direction.DESC;
            default -> throw new InvalidQueryParameterException(
                    "Sort must be either name,asc or name,desc");
        };
    }

    private String optionalDisplayValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return NameNormalizer.displayName(value);
    }
}
