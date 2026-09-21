package com.campuscouriers.user.auth;

import static com.campuscouriers.user.TestConstants.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import java.util.HashMap;

import com.campuscouriers.user.auth.dto.RegisterRequest;
import com.campuscouriers.user.security.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @MockitoBean
    private AuthService authService;

    ObjectMapper objectMapper = new ObjectMapper();

    // F1 - Register Profile: /auth/register
    @Nested
    @DisplayName("F1 - Register Profile: /auth/register")
    class RegistrationTests {

        @DisplayName("Valid Registration Request")
        // Valid Request
        void register_validRequest_returns201AndDelegatesToService() throws Exception {
            Map<String, String> body = validBody();
            postRegister(body).andExpect(status().isCreated());
            verify(authService).register(
                new RegisterRequest(
                        VALID_NAME,
                        VALID_EMAIL,
                        VALID_PASSWORD
                )
            );
        }

        @Nested
        @DisplayName("F1.1 - The service should validate the name, NUS email, and password")
        class ValidateRegistrationTests {

            // F1.1.1 - Missing Fields
            @DisplayName("F1.1.1 - Name, email, and password shall not allowed to be null")
            @ParameterizedTest
            @ValueSource(strings = {"name", "email", "password"})
            void register_missingField_returns400(String field) throws Exception {
                Map<String, String> body = validBody();
                body.remove(field);
                postRegister(body).andExpect(status().isBadRequest());
                verifyNoInteractions(authService);
            }

            // F1.1.1 - Empty Fields
            @DisplayName("F1.1.1 - Name, email, and password shall not be allowed to be empty")
            @ParameterizedTest
            @ValueSource(strings = {"name", "email", "password"})
            void register_emptyField_returns400(String field) throws Exception {
                postRegisterWith(field, "")
                        .andExpect(status().isBadRequest());
                verifyNoInteractions(authService);
            }

            // F1.1.1 - Maximum Name Length
            @DisplayName("F1.1.1 - Name should have a maximum length of 50 characters")
            @Test
            void register_longName_returns400() throws Exception {
                postRegisterWith("name", "ThisIsAVeryLongNameThatCannotFitInto50Characters ThisIsAVeryLongSurname")
                        .andExpect(status().isBadRequest());
                verifyNoInteractions(authService);
            }

            // F1.1.3 - Valid NUS Email Domain
            @DisplayName("F1.1.3 - Email format shall be validated")
            @Test
            void register_nonNUSEmail_returns400() throws Exception {
                postRegisterWith("email", "NTUStudent@gmail.com")
                        .andExpect(status().isBadRequest());
                verifyNoInteractions(authService);
            }

            // F1.1.3 - Valid Email Format
            @DisplayName("F1.1.3 - Email format shall be validated to have an NUS domain")
            @Test
            void register_malformedEmail_returns400() throws Exception {
                postRegisterWith("email", "not-an-email")
                        .andExpect(status().isBadRequest());
                verifyNoInteractions(authService);
            }

            // F1.1.4 - Password Contains Uppercase
            @DisplayName("F1.1.4 - Passwords should be validated to contain lowercase characters")
            @Test
            void register_noUpperCasePassword_returns400() throws Exception {
                postRegisterWith("password", "lower+!_12345678")
                        .andExpect(status().isBadRequest());
                verifyNoInteractions(authService);
            }

            // F1.1.4 - Password Contains Lowercase
            @DisplayName("F1.1.4 - Passwords should be validated to contain uppercase characters")
            @Test
            void register_noLowerCasePassword_returns400() throws Exception {
                postRegisterWith("password", "UPPER+!_12345678")
                        .andExpect(status().isBadRequest());
                verifyNoInteractions(authService);
            }

            // F1.1.4 - Password Contains Numbers
            @DisplayName("F1.1.4 - Passwords should be validated to contain numbers")
            @Test
            void register_noNumberPassword_returns400() throws Exception {
                postRegisterWith("password", "lower+!_UPPERCASEATTHEEND")
                        .andExpect(status().isBadRequest());
                verifyNoInteractions(authService);
            }

            // F1.1.4 - Password Contains Special Characters
            @DisplayName("F1.1.4 - Passwords should be validated to contain special characters")
            @Test
            void register_noSpecialCharacterPassword_returns400() throws Exception {
                postRegisterWith("password", "lower123UPPERCASEATTHEEND")
                        .andExpect(status().isBadRequest());
                verifyNoInteractions(authService);
            }

            // F1.1.4 - Minimum Password Length
            @DisplayName("F1.1.4 - Passwords should be validated to contain at least 16 characters")
            @Test
            void register_shortPassword_returns400() throws Exception {
                postRegisterWith("password", "Sh0rt!123456789")
                        .andExpect(status().isBadRequest());
                verifyNoInteractions(authService);
            }

            // F1.1.4 - Maximum Password Length
            @DisplayName("F1.1.4 - Passwords should be validated to contain at most 128 characters")
            @Test
            void register_longPassword_returns400() throws Exception {
                postRegisterWith("password", "lowerUPPER1234+!".repeat(8).concat("a"))
                        .andExpect(status().isBadRequest());
                verifyNoInteractions(authService);
            }

        }

        // ---- Helpers ----
        private static Map<String, String> validBody() {
            Map<String, String> body = new HashMap<>();
            body.put("name", VALID_NAME);
            body.put("email", VALID_EMAIL);
            body.put("password", VALID_PASSWORD);
            return body;
        }

        private ResultActions postRegister(Map<String, String>body) throws Exception {
            return mockMvc.perform(post("/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)));
        }

        private ResultActions postRegisterWith(String field, String modifiedValue) throws Exception {
            Map<String, String> body = validBody();
            body.put(field, modifiedValue);
            return postRegister(body);
        }
    }
}