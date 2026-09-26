package com.campuscouriers.supplier.service;

import com.campuscouriers.supplier.dto.CreateSupplierRequest;
import com.campuscouriers.supplier.entity.Building;
import com.campuscouriers.supplier.entity.Category;
import com.campuscouriers.supplier.entity.Supplier;
import com.campuscouriers.supplier.entity.SupplierStatus;
import com.campuscouriers.supplier.exception.DuplicateSupplierException;
import com.campuscouriers.supplier.exception.ReferenceNotFoundException;
import com.campuscouriers.supplier.repository.BuildingRepository;
import com.campuscouriers.supplier.repository.CategoryRepository;
import com.campuscouriers.supplier.repository.SupplierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SupplierServiceTest {

    @Mock
    private SupplierRepository supplierRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private BuildingRepository buildingRepository;

    @InjectMocks
    private SupplierService supplierService;

    private UUID categoryId;
    private UUID buildingId;
    private Category category;
    private Building building;

    @BeforeEach
    void setUp() {
        categoryId = UUID.randomUUID();
        buildingId = UUID.randomUUID();
        category = new Category("Food", "food");
        building = new Building("COM3", "com3");
        ReflectionTestUtils.setField(category, "id", categoryId);
        ReflectionTestUtils.setField(building, "id", buildingId);
    }

    @Test
    void create_validRequest_normalizesAndPersistsActiveSupplier() {
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(buildingRepository.findById(buildingId)).thenReturn(Optional.of(building));
        when(supplierRepository.saveAndFlush(any(Supplier.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = supplierService.create(validRequest("  Coffee   Bean  ", "  Level   1 "));

        ArgumentCaptor<Supplier> captor = ArgumentCaptor.forClass(Supplier.class);
        verify(supplierRepository).existsByNormalizedNameAndBuildingId(
                "coffee bean", buildingId);
        verify(supplierRepository).saveAndFlush(captor.capture());
        Supplier saved = captor.getValue();
        assertThat(saved.getName()).isEqualTo("Coffee Bean");
        assertThat(saved.getFloor()).isEqualTo("Level 1");
        assertThat(saved.getStatus()).isEqualTo(SupplierStatus.ACTIVE);
        assertThat(response.category().id()).isEqualTo(categoryId);
        assertThat(response.building().id()).isEqualTo(buildingId);
    }

    @Test
    void create_missingCategory_throwsAndDoesNotSave() {
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> supplierService.create(validRequest("Coffee Bean", "1")))
                .isInstanceOf(ReferenceNotFoundException.class);

        verify(buildingRepository, never()).findById(any());
        verify(supplierRepository, never()).saveAndFlush(any());
    }

    @Test
    void create_duplicateBranch_throwsAndDoesNotSave() {
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(buildingRepository.findById(buildingId)).thenReturn(Optional.of(building));
        when(supplierRepository.existsByNormalizedNameAndBuildingId(
                "coffee bean", buildingId)).thenReturn(true);

        assertThatThrownBy(() -> supplierService.create(validRequest("COFFEE BEAN", "1")))
                .isInstanceOf(DuplicateSupplierException.class);

        verify(supplierRepository, never()).saveAndFlush(any());
    }

    private CreateSupplierRequest validRequest(String name, String floor) {
        return new CreateSupplierRequest(
                name,
                categoryId,
                buildingId,
                floor,
                "Near the main entrance",
                LocalTime.of(9, 0),
                LocalTime.of(18, 0),
                "https://example.com/image.jpg"
        );
    }
}
