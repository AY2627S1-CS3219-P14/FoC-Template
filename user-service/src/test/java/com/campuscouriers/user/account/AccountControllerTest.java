package com.campuscouriers.user.account;

import com.campuscouriers.user.account.dto.AccountResponse;
import com.campuscouriers.user.entity.AccountType;
import com.campuscouriers.user.exception.InsufficientPermissionException;
import com.campuscouriers.user.exception.InvalidAccessTokenException;
import com.campuscouriers.user.exception.InvalidAccountException;
import com.campuscouriers.user.exception.LastAdministratorException;
import com.campuscouriers.user.security.SecurityConfig;
import com.campuscouriers.user.security.access.AccessTokenClaims;
import com.campuscouriers.user.security.access.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;

import static com.campuscouriers.user.TestConstants.VALID_EMAIL;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AccountController.class)
@Import(SecurityConfig.class)
class AccountControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @MockitoBean
    private AccountService accountService;
    @MockitoBean
    private JwtService jwtService;    // stubbed so requests authenticate through the real JwtAuthenticationFilter

    private static final String ADMIN_TOKEN = "admin-token";
    private static final String STUDENT_TOKEN = "student-token";
    private final UUID targetId = new UUID(0L, 2L);
    private final AccessTokenClaims administrator =
            new AccessTokenClaims(new UUID(0L, 1L), "admin@u.nus.edu", AccountType.Administrator);
    private final AccessTokenClaims student =
            new AccessTokenClaims(new UUID(0L, 3L), "bob@u.nus.edu", AccountType.Student);

    @BeforeEach
    void stubTokenValidation() {
        lenient().when(jwtService.parseAndValidate(ADMIN_TOKEN)).thenReturn(administrator);
        lenient().when(jwtService.parseAndValidate(STUDENT_TOKEN)).thenReturn(student);
    }

    @Nested
    @DisplayName("Valid requests return 200 with the updated account")
    class SuccessTests {

        @ParameterizedTest
        @CsvSource({
                "Student, Student",
                "student, Student",
                "Administrator, Administrator",
                "administrator, Administrator"
        })
        void updateType_withAcceptedSpelling_returns200WithUpdatedAccount(String value, AccountType expected) throws Exception {
            when(accountService.updateType(targetId, expected, administrator))
                    .thenReturn(new AccountResponse(targetId, VALID_EMAIL, expected));

            patchType(ADMIN_TOKEN, targetId.toString(), body(value))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(targetId.toString()))
                    .andExpect(jsonPath("$.email").value(VALID_EMAIL))
                    .andExpect(jsonPath("$.type").value(expected.name()));

            verify(accountService).updateType(targetId, expected, administrator);
        }

        @Test
        void updateType_withExtraFields_ignoresThemAndReturns200() throws Exception {
            when(accountService.updateType(targetId, AccountType.Student, administrator))
                    .thenReturn(new AccountResponse(targetId, VALID_EMAIL, AccountType.Student));

            patchType(ADMIN_TOKEN, targetId.toString(), """
                    {"type":"Student","email":"hacker@u.nus.edu","id":"00000000-0000-0000-0000-000000000009"}
                    """)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value(VALID_EMAIL));

            verify(accountService).updateType(targetId, AccountType.Student, administrator);
        }
    }

    @Nested
    @DisplayName("Malformed requests return 400 before any permission check")
    class ValidationTests {

        @ParameterizedTest
        @ValueSource(strings = {"STUDENT", "ADMINISTRATOR", "admin", "Moderator", ""})
        void updateType_withInvalidTypeValue_returns400(String value) throws Exception {
            patchType(ADMIN_TOKEN, targetId.toString(), body(value))
                    .andExpect(status().isBadRequest());

            verifyNoInteractions(accountService);
        }

        @ParameterizedTest
        @ValueSource(strings = {"{}", "{\"type\":null}", "{\"role\":\"Student\"}", "", "{\"type\":", "{\"type\":[\"Student\"]}"})
        void updateType_withMissingOrUnreadableType_returns400(String content) throws Exception {
            patchType(ADMIN_TOKEN, targetId.toString(), content)
                    .andExpect(status().isBadRequest());

            verifyNoInteractions(accountService);
        }

        @DisplayName("A malformed body from a non-administrator is 400, not 403")
        @Test
        void updateType_asStudentWithInvalidBody_returns400() throws Exception {
            patchType(STUDENT_TOKEN, targetId.toString(), body("Moderator"))
                    .andExpect(status().isBadRequest());

            verifyNoInteractions(accountService);
        }

        @Test
        void updateType_withMalformedAccountId_returns400() throws Exception {
            patchType(ADMIN_TOKEN, "not-a-uuid", body("Student"))
                    .andExpect(status().isBadRequest());

            verifyNoInteractions(accountService);
        }
    }

    @Nested
    @DisplayName("Service exceptions map to 403, 404 and 409")
    class ExceptionMappingTests {

        @Test
        void updateType_withInsufficientPermission_returns403() throws Exception {
            when(accountService.updateType(targetId, AccountType.Administrator, student))
                    .thenThrow(new InsufficientPermissionException());

            patchType(STUDENT_TOKEN, targetId.toString(), body("Administrator"))
                    .andExpect(status().isForbidden());
        }

        @Test
        void updateType_withMissingAccount_returns404() throws Exception {
            when(accountService.updateType(targetId, AccountType.Student, administrator))
                    .thenThrow(new InvalidAccountException());

            patchType(ADMIN_TOKEN, targetId.toString(), body("Student"))
                    .andExpect(status().isNotFound());
        }

        @Test
        void updateType_demotingLastAdministrator_returns409() throws Exception {
            when(accountService.updateType(targetId, AccountType.Student, administrator))
                    .thenThrow(new LastAdministratorException());

            patchType(ADMIN_TOKEN, targetId.toString(), body("Student"))
                    .andExpect(status().isConflict());
        }
    }

    @Nested
    @DisplayName("Only PATCH is allowed, and requests shall be authenticated")
    class MethodAndAuthenticationTests {

        @ParameterizedTest
        @ValueSource(strings = {"GET", "POST", "PUT", "DELETE"})
        void accounts_withOtherMethods_returns405(String method) throws Exception {
            mockMvc.perform(request(HttpMethod.valueOf(method), "/api/v1/accounts/{id}", targetId)
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + ADMIN_TOKEN)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body("Student")))
                    .andExpect(status().isMethodNotAllowed());

            verifyNoInteractions(accountService);
        }

        @Test
        void updateType_withoutAccessToken_returns401() throws Exception {
            mockMvc.perform(patch("/api/v1/accounts/{id}", targetId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body("Student")))
                    .andExpect(status().isUnauthorized());

            verifyNoInteractions(accountService);
        }

        @Test
        void updateType_withInvalidAccessToken_returns401() throws Exception {
            when(jwtService.parseAndValidate("bad-token")).thenThrow(new InvalidAccessTokenException());

            patchType("bad-token", targetId.toString(), body("Student"))
                    .andExpect(status().isUnauthorized());

            verifyNoInteractions(accountService);
        }
    }

    // ---- Helpers ----
    private static String body(String type) {
        return String.format("""
                {"type":"%s"}
                """, type);
    }

    private ResultActions patchType(String token, String accountId, String content) throws Exception {
        return mockMvc.perform(patch("/api/v1/accounts/" + accountId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(content));
    }

}
