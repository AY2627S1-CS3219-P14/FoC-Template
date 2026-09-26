package com.campuscouriers.supplier.repository;

import com.campuscouriers.supplier.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BuildingRepository extends JpaRepository<Building, UUID> {

    boolean existsByNormalizedName(String normalizedName);

    Optional<Building> findByNormalizedName(String normalizedName);
}
