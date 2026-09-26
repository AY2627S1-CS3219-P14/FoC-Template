package com.campuscouriers.supplier.service;

import com.campuscouriers.supplier.dto.BuildingResponse;
import com.campuscouriers.supplier.dto.CreateBuildingRequest;
import com.campuscouriers.supplier.entity.Building;
import com.campuscouriers.supplier.exception.DuplicateBuildingException;
import com.campuscouriers.supplier.repository.BuildingRepository;
import com.campuscouriers.supplier.util.NameNormalizer;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BuildingService {

    private final BuildingRepository buildingRepository;

    public BuildingService(BuildingRepository buildingRepository) {
        this.buildingRepository = buildingRepository;
    }

    @Transactional
    public BuildingResponse create(CreateBuildingRequest request) {
        String displayName = NameNormalizer.displayName(request.name());
        String normalizedName = NameNormalizer.normalizedName(displayName);

        if (buildingRepository.existsByNormalizedName(normalizedName)) {
            throw new DuplicateBuildingException(displayName);
        }

        try {
            Building building = buildingRepository.saveAndFlush(new Building(displayName, normalizedName));
            return BuildingResponse.from(building);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateBuildingException(displayName);
        }
    }
}
