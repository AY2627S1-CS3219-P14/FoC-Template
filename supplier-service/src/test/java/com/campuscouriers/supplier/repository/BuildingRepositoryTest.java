package com.campuscouriers.supplier.repository;

import com.campuscouriers.supplier.entity.Building;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@Testcontainers
class BuildingRepositoryTest {

    @Container
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private BuildingRepository buildingRepository;

    @Test
    void findByNormalizedName_findsPersistedBuilding() {
        buildingRepository.saveAndFlush(new Building("COM3", "com3"));

        assertThat(buildingRepository.findByNormalizedName("com3"))
                .get()
                .extracting(Building::getName)
                .isEqualTo("COM3");
    }

    @Test
    void normalizedNameUniqueConstraint_rejectsDuplicate() {
        buildingRepository.saveAndFlush(new Building("COM3", "com3"));

        assertThatThrownBy(() -> buildingRepository.saveAndFlush(new Building("com3", "com3")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
