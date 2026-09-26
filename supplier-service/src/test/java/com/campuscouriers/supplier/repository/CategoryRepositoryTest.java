package com.campuscouriers.supplier.repository;

import com.campuscouriers.supplier.entity.Category;
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
class CategoryRepositoryTest {

    @Container
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    void findByNormalizedName_findsPersistedCategory() {
        categoryRepository.saveAndFlush(new Category("Food", "food"));

        assertThat(categoryRepository.findByNormalizedName("food"))
                .get()
                .extracting(Category::getName)
                .isEqualTo("Food");
    }

    @Test
    void normalizedNameUniqueConstraint_rejectsDuplicate() {
        categoryRepository.saveAndFlush(new Category("Food", "food"));

        assertThatThrownBy(() -> categoryRepository.saveAndFlush(new Category("FOOD", "food")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
