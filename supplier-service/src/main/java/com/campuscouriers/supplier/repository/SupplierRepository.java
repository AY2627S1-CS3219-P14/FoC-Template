package com.campuscouriers.supplier.repository;

import com.campuscouriers.supplier.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    boolean existsByNormalizedNameAndBuildingId(String normalizedName, UUID buildingId);
}
