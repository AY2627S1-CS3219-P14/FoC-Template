package com.campuscouriers.supplier.service;

import com.campuscouriers.supplier.dto.CreateBuildingRequest;
import com.campuscouriers.supplier.entity.Building;
import com.campuscouriers.supplier.entity.BuildingStatus;
import com.campuscouriers.supplier.exception.DuplicateBuildingException;
import com.campuscouriers.supplier.repository.BuildingRepository;
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
class BuildingServiceTest {

    @Mock
    private BuildingRepository buildingRepository;

    @InjectMocks
    private BuildingService buildingService;

    @Test
    void create_trimsAndNormalizesNameAndDefaultsToActive() {
        when(buildingRepository.saveAndFlush(any(Building.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = buildingService.create(new CreateBuildingRequest("  Central   Library  "));

        ArgumentCaptor<Building> captor = ArgumentCaptor.forClass(Building.class);
        verify(buildingRepository).existsByNormalizedName("central library");
        verify(buildingRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Central Library");
        assertThat(captor.getValue().getNormalizedName()).isEqualTo("central library");
        assertThat(response.name()).isEqualTo("Central Library");
        assertThat(response.status()).isEqualTo(BuildingStatus.ACTIVE);
    }

    @Test
    void create_whenNormalizedNameExists_throwsAndDoesNotSave() {
        when(buildingRepository.existsByNormalizedName("com3")).thenReturn(true);

        assertThatThrownBy(() -> buildingService.create(new CreateBuildingRequest(" COM3 ")))
                .isInstanceOf(DuplicateBuildingException.class);

        verify(buildingRepository, never()).saveAndFlush(any());
    }
}
