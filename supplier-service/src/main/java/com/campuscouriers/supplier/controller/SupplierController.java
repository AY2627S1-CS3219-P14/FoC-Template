package com.campuscouriers.supplier.controller;

import com.campuscouriers.supplier.dto.CreateSupplierRequest;
import com.campuscouriers.supplier.dto.SupplierResponse;
import com.campuscouriers.supplier.dto.SupplierPageResponse;
import com.campuscouriers.supplier.dto.UpdateSupplierRequest;
import com.campuscouriers.supplier.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @PostMapping
    public ResponseEntity<SupplierResponse> create(@Valid @RequestBody CreateSupplierRequest request) {
        SupplierResponse response = supplierService.create(request);
        return ResponseEntity.created(URI.create("/suppliers/" + response.id())).body(response);
    }

    @GetMapping
    public SupplierPageResponse findActive(
            @RequestParam(required = false, name = "q") String query,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID buildingId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name,asc") String sort
    ) {
        return supplierService.findActive(query, categoryId, buildingId, page, size, sort);
    }

    @GetMapping("/{id}")
    public SupplierResponse findActiveById(@PathVariable UUID id) {
        return supplierService.findActiveById(id);
    }

    @PutMapping("/{id}")
    public SupplierResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSupplierRequest request
    ) {
        return supplierService.update(id, request);
    }
}
