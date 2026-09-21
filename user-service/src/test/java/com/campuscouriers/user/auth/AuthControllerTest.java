package com.campuscouriers.user.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import java.util.HashMap;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    ObjectMapper objectMapper = new ObjectMapper();

    @Nested
    @DisplayName("F1 - Register Profile: /auth/register")
    class RegistrationTests {

        @Nested
        @DisplayName("F1.1. - The service should validate the name, NUS email, and password")
        class ValidateRegistrationTests {
            // F1.1.1 - Missing Fields
            @DisplayName("F1.1.1 - Name, email, and password shall not allowed to be null")
            @ParameterizedTest
            @ValueSource(strings = {"name", "email", "password"})
            void register_missingField_returns400(String field) throws Exception {
                Map<String, String> body = validBody();
                body.remove(field);
                postRegister(body).andExpect(status().isBadRequest());
            }

            // F1.1.1 - Empty Fields
            @DisplayName("F1.1.1 - Name, email, and password shall not be allowed to be empty")
            @ParameterizedTest
            @ValueSource(strings = {"name", "email", "password"})
            void register_emptyField_returns400(String field) throws Exception {
                Map<String, String> body = validBody();
                body.put(field, "");
                postRegister(body).andExpect(status().isBadRequest());
            }
        }

        // ---- Helpers ----
        private static Map<String, String> validBody() {
            Map<String, String> body = new HashMap<>();
            body.put("name", "Alice");
            body.put("email", "alice@u.nus.edu");
            body.put("password", "TEST_Str0ngPassw0rd!");
            return body;
        }

        private ResultActions postRegister(Map<String, String> body) throws Exception {
            return mockMvc.perform(post("/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)));
        }
    }
}