package com.campuscouriers.supplier.controller;

import com.campuscouriers.supplier.dto.BuildingResponse;
import com.campuscouriers.supplier.dto.CreateBuildingRequest;
import com.campuscouriers.supplier.entity.BuildingStatus;
import com.campuscouriers.supplier.exception.DuplicateBuildingException;
import com.campuscouriers.supplier.exception.GlobalExceptionHandler;
import com.campuscouriers.supplier.service.BuildingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BuildingController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class BuildingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BuildingService buildingService;

    @Test
    void create_validRequest_returns201() throws Exception {
        UUID id = UUID.randomUUID();
        when(buildingService.create(new CreateBuildingRequest("COM3")))
                .thenReturn(new BuildingResponse(id, "COM3", BuildingStatus.ACTIVE));

        mockMvc.perform(post("/buildings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"COM3\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/buildings/" + id))
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.name").value("COM3"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void create_overlongName_returns400WithoutCallingService() throws Exception {
        String name = "a".repeat(61);

        mockMvc.perform(post("/buildings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(buildingService);
    }

    @Test
    void create_duplicateName_returns409ProblemDetail() throws Exception {
        doThrow(new DuplicateBuildingException("COM3"))
                .when(buildingService).create(any(CreateBuildingRequest.class));

        mockMvc.perform(post("/buildings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"COM3\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.detail").value("A building named 'COM3' already exists"));
    }
}
