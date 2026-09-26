package com.campuscouriers.supplier.service;

import com.campuscouriers.supplier.dto.CreateCategoryRequest;
import com.campuscouriers.supplier.entity.Category;
import com.campuscouriers.supplier.entity.CategoryStatus;
import com.campuscouriers.supplier.exception.DuplicateCategoryException;
import com.campuscouriers.supplier.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    void create_trimsAndNormalizesNameAndDefaultsToActive() {
        when(categoryRepository.saveAndFlush(any(Category.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = categoryService.create(new CreateCategoryRequest("  Food   and Drinks  "));

        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository).existsByNormalizedName("food and drinks");
        verify(categoryRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Food and Drinks");
        assertThat(captor.getValue().getNormalizedName()).isEqualTo("food and drinks");
        assertThat(response.name()).isEqualTo("Food and Drinks");
        assertThat(response.status()).isEqualTo(CategoryStatus.ACTIVE);
    }

    @Test
    void create_whenNormalizedNameExists_throwsAndDoesNotSave() {
        when(categoryRepository.existsByNormalizedName("food")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.create(new CreateCategoryRequest(" FOOD ")))
                .isInstanceOf(DuplicateCategoryException.class);

        verify(categoryRepository, never()).saveAndFlush(any());
    }
}
