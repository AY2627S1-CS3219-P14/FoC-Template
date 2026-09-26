package com.campuscouriers.supplier.controller;

import com.campuscouriers.supplier.dto.BuildingResponse;
import com.campuscouriers.supplier.dto.CreateBuildingRequest;
import com.campuscouriers.supplier.service.BuildingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/buildings")
public class BuildingController {

    private final BuildingService buildingService;

    public BuildingController(BuildingService buildingService) {
        this.buildingService = buildingService;
    }

    @PostMapping
    public ResponseEntity<BuildingResponse> create(@Valid @RequestBody CreateBuildingRequest request) {
        BuildingResponse response = buildingService.create(request);
        return ResponseEntity.created(URI.create("/buildings/" + response.id())).body(response);
    }
}
