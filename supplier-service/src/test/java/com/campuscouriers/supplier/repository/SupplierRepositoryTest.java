package com.campuscouriers.supplier.repository;

import com.campuscouriers.supplier.entity.Building;
import com.campuscouriers.supplier.entity.Category;
import com.campuscouriers.supplier.entity.Supplier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@Testcontainers
class SupplierRepositoryTest {

    @Container
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private SupplierRepository supplierRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private BuildingRepository buildingRepository;

    private Category category;
    private Building building;

    @BeforeEach
    void setUp() {
        category = categoryRepository.saveAndFlush(new Category("Food", "food"));
        building = buildingRepository.saveAndFlush(new Building("COM3", "com3"));
    }

    @Test
    void existsByBranchIdentity_findsPersistedSupplier() {
        supplierRepository.saveAndFlush(supplier("Coffee Bean", "coffee bean", "1", "1"));

        assertThat(supplierRepository.existsByNormalizedNameAndBuildingId(
                "coffee bean", building.getId())).isTrue();
    }

    @Test
    void branchUniqueConstraint_rejectsCaseVariantAtSameBuilding() {
        supplierRepository.saveAndFlush(supplier("Coffee Bean", "coffee bean", "1", "1"));

        assertThatThrownBy(() -> supplierRepository.saveAndFlush(
                supplier("COFFEE BEAN", "coffee bean", "1", "1")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void branchUniqueConstraint_rejectsSameNameAtDifferentFloor() {
        supplierRepository.saveAndFlush(supplier("Coffee Bean", "coffee bean", "1", "1"));

        assertThatThrownBy(() -> supplierRepository.saveAndFlush(
                supplier("Coffee Bean", "coffee bean", "2", "2")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private Supplier supplier(String name, String normalizedName, String floor, String normalizedFloor) {
        return new Supplier(
                name,
                normalizedName,
                category,
                building,
                floor,
                normalizedFloor,
                "Near the main entrance",
                LocalTime.of(9, 0),
                LocalTime.of(18, 0),
                null
        );
    }
}
