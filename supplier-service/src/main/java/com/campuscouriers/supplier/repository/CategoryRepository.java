package com.campuscouriers.supplier.repository;

import com.campuscouriers.supplier.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    boolean existsByNormalizedName(String normalizedName);

    Optional<Category> findByNormalizedName(String normalizedName);
}
