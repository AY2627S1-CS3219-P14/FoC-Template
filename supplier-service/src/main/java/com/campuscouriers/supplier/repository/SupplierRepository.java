package com.campuscouriers.supplier.repository;

import com.campuscouriers.supplier.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public interface SupplierRepository extends JpaRepository<Supplier, UUID>, JpaSpecificationExecutor<Supplier> {

    boolean existsByNormalizedNameAndBuildingId(String normalizedName, UUID buildingId);

    @Override
    @EntityGraph(attributePaths = {"category", "building"})
    Page<Supplier> findAll(Specification<Supplier> specification, Pageable pageable);
}
