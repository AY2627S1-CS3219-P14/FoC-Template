package com.campuscouriers.supplier.controller;

import com.campuscouriers.supplier.dto.CreateSupplierRequest;
import com.campuscouriers.supplier.dto.SupplierResponse;
import com.campuscouriers.supplier.entity.SupplierStatus;
import com.campuscouriers.supplier.exception.DuplicateSupplierException;
import com.campuscouriers.supplier.exception.GlobalExceptionHandler;
import com.campuscouriers.supplier.exception.ReferenceNotFoundException;
import com.campuscouriers.supplier.service.SupplierService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SupplierController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class SupplierControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SupplierService supplierService;

    @Test
    void create_validRequest_returns201() throws Exception {
        UUID supplierId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        UUID buildingId = UUID.randomUUID();
        when(supplierService.create(any(CreateSupplierRequest.class))).thenReturn(new SupplierResponse(
                supplierId,
                "Coffee Bean",
                new SupplierResponse.ReferenceSummary(categoryId, "Food"),
                new SupplierResponse.ReferenceSummary(buildingId, "COM3"),
                "1",
                "Near the main entrance",
                LocalTime.of(9, 0),
                LocalTime.of(18, 0),
                null,
                SupplierStatus.ACTIVE
        ));

        mockMvc.perform(post("/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validJson(categoryId, buildingId)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/suppliers/" + supplierId))
                .andExpect(jsonPath("$.id").value(supplierId.toString()))
                .andExpect(jsonPath("$.name").value("Coffee Bean"))
                .andExpect(jsonPath("$.category.id").value(categoryId.toString()))
                .andExpect(jsonPath("$.building.name").value("COM3"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void create_missingRequiredFields_returns400WithoutCallingService() throws Exception {
        mockMvc.perform(post("/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(supplierService);
    }

    @Test
    void create_nameLongerThan60Characters_returns400WithoutCallingService() throws Exception {
        UUID categoryId = UUID.randomUUID();
        UUID buildingId = UUID.randomUUID();
        String body = """
                {
                  "name": "%s",
                  "categoryId": "%s",
                  "buildingId": "%s"
                }
                """.formatted("a".repeat(61), categoryId, buildingId);

        mockMvc.perform(post("/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(supplierService);
    }

    @Test
    void create_unknownCategory_returns404ProblemDetail() throws Exception {
        UUID categoryId = UUID.randomUUID();
        UUID buildingId = UUID.randomUUID();
        doThrow(new ReferenceNotFoundException("Category", categoryId))
                .when(supplierService).create(any(CreateSupplierRequest.class));

        mockMvc.perform(post("/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validJson(categoryId, buildingId)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void create_duplicateBranch_returns409ProblemDetail() throws Exception {
        UUID categoryId = UUID.randomUUID();
        UUID buildingId = UUID.randomUUID();
        doThrow(new DuplicateSupplierException("Coffee Bean"))
                .when(supplierService).create(any(CreateSupplierRequest.class));

        mockMvc.perform(post("/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validJson(categoryId, buildingId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    private String validJson(UUID categoryId, UUID buildingId) {
        return """
                {
                  "name": "Coffee Bean",
                  "categoryId": "%s",
                  "buildingId": "%s",
                  "floor": "1",
                  "description": "Near the main entrance",
                  "openingTime": "09:00:00",
                  "closingTime": "18:00:00"
                }
                """.formatted(categoryId, buildingId);
    }
}
