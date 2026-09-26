package com.campuscouriers.supplier.service;

import com.campuscouriers.supplier.dto.CategoryResponse;
import com.campuscouriers.supplier.dto.CreateCategoryRequest;
import com.campuscouriers.supplier.entity.Category;
import com.campuscouriers.supplier.exception.DuplicateCategoryException;
import com.campuscouriers.supplier.repository.CategoryRepository;
import com.campuscouriers.supplier.util.NameNormalizer;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public CategoryResponse create(CreateCategoryRequest request) {
        String displayName = NameNormalizer.displayName(request.name());
        String normalizedName = NameNormalizer.normalizedName(displayName);

        if (categoryRepository.existsByNormalizedName(normalizedName)) {
            throw new DuplicateCategoryException(displayName);
        }

        try {
            Category category = categoryRepository.saveAndFlush(new Category(displayName, normalizedName));
            return CategoryResponse.from(category);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateCategoryException(displayName);
        }
    }
}
