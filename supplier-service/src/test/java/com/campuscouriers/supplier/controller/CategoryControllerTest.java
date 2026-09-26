package com.campuscouriers.supplier.controller;

import com.campuscouriers.supplier.dto.CategoryResponse;
import com.campuscouriers.supplier.dto.CreateCategoryRequest;
import com.campuscouriers.supplier.entity.CategoryStatus;
import com.campuscouriers.supplier.exception.DuplicateCategoryException;
import com.campuscouriers.supplier.exception.GlobalExceptionHandler;
import com.campuscouriers.supplier.service.CategoryService;
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

@WebMvcTest(CategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CategoryService categoryService;

    @Test
    void create_validRequest_returns201() throws Exception {
        UUID id = UUID.randomUUID();
        when(categoryService.create(new CreateCategoryRequest("Food")))
                .thenReturn(new CategoryResponse(id, "Food", CategoryStatus.ACTIVE));

        mockMvc.perform(post("/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Food\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/categories/" + id))
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.name").value("Food"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void create_blankName_returns400WithoutCallingService() throws Exception {
        mockMvc.perform(post("/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"   \"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(categoryService);
    }

    @Test
    void create_nameLongerThan60Characters_returns400WithoutCallingService() throws Exception {
        String name = "a".repeat(61);

        mockMvc.perform(post("/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(categoryService);
    }

    @Test
    void create_duplicateName_returns409ProblemDetail() throws Exception {
        doThrow(new DuplicateCategoryException("Food"))
                .when(categoryService).create(any(CreateCategoryRequest.class));

        mockMvc.perform(post("/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Food\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.detail").value("A category named 'Food' already exists"));
    }
}
