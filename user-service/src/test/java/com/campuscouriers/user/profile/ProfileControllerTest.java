package com.campuscouriers.user.profile;

import com.campuscouriers.user.entity.AccountType;
import com.campuscouriers.user.exception.InvalidAccessTokenException;
import com.campuscouriers.user.exception.InvalidProfileException;
import com.campuscouriers.user.profile.dto.ProfileResponse;
import com.campuscouriers.user.security.SecurityConfig;
import com.campuscouriers.user.security.access.AccessTokenClaims;
import com.campuscouriers.user.security.access.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static com.campuscouriers.user.TestConstants.VALID_EMAIL;
import static com.campuscouriers.user.TestConstants.VALID_NAME;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProfileController.class)
@Import(SecurityConfig.class)
class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @MockitoBean
    private ProfileService profileService;
    @MockitoBean
    private JwtService jwtService;    // stubbed so requests authenticate through the real JwtAuthenticationFilter

    private static final String VALID_TOKEN = "valid-token";
    private final UUID profileId = new UUID(0L, 1L);
    private final AccessTokenClaims claims = new AccessTokenClaims(profileId, VALID_EMAIL, AccountType.Student);

    @BeforeEach
    void stubTokenValidation() {
        lenient().when(jwtService.parseAndValidate(VALID_TOKEN)).thenReturn(claims);
    }

    @Nested
    @DisplayName("F5 - View Profile: GET /api/v1/profiles/me")
    class GetMyProfileTests {

        @Test
        void getMyProfile_withValidToken_returns200WithNameAndEmail() throws Exception {
            when(profileService.getMyProfile(claims)).thenReturn(new ProfileResponse(VALID_NAME, VALID_EMAIL));

            mockMvc.perform(get("/api/v1/profiles/me")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value(VALID_NAME))
                    .andExpect(jsonPath("$.email").value(VALID_EMAIL));

            verify(profileService).getMyProfile(claims);
            verify(profileService, never()).getProfile(any(), any());
        }

        @Test
        void getMyProfile_withMissingProfile_returns404() throws Exception {
            when(profileService.getMyProfile(claims)).thenThrow(new InvalidProfileException());

            mockMvc.perform(get("/api/v1/profiles/me")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("F5 - View Profile: /api/v1/profiles/{profileId}")
    class GetProfileTests {

        @Test
        void getProfile_whenPermitted_returns200WithNameAndEmail() throws Exception {
            when(profileService.getProfile(profileId, claims)).thenReturn(new ProfileResponse(VALID_NAME, VALID_EMAIL));

            mockMvc.perform(get("/api/v1/profiles/{id}", profileId)
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value(VALID_NAME))
                    .andExpect(jsonPath("$.email").value(VALID_EMAIL));

            verify(profileService).getProfile(profileId, claims);
        }

        @DisplayName("Neither owner nor Administrator, or profile does not exist, returns 404")
        @Test
        void getProfile_whenServiceRejects_returns404() throws Exception {
            UUID otherProfileId = new UUID(0L, 2L);
            when(profileService.getProfile(otherProfileId, claims)).thenThrow(new InvalidProfileException());

            mockMvc.perform(get("/api/v1/profiles/{id}", otherProfileId)
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN))
                    .andExpect(status().isNotFound());
        }

        @Test
        void getProfile_withMalformedId_returns400() throws Exception {
            mockMvc.perform(get("/api/v1/profiles/not-a-uuid")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN))
                    .andExpect(status().isBadRequest());

            verifyNoInteractions(profileService);
        }
    }

    @Nested
    @DisplayName("Requests shall be authenticated with a Bearer access token")
    class AuthenticationTests {

        @ParameterizedTest
        @ValueSource(strings = {"/api/v1/profiles/me", "/api/v1/profiles/00000000-0000-0000-0000-000000000001"})
        void profiles_withoutAccessToken_returns401(String path) throws Exception {
            mockMvc.perform(get(path))
                    .andExpect(status().isUnauthorized());

            verifyNoInteractions(profileService);
        }

        @ParameterizedTest
        @ValueSource(strings = {"/api/v1/profiles/me", "/api/v1/profiles/00000000-0000-0000-0000-000000000001"})
        void profiles_withInvalidAccessToken_returns401(String path) throws Exception {
            when(jwtService.parseAndValidate("bad-token")).thenThrow(new InvalidAccessTokenException());

            mockMvc.perform(get(path)
                            .header(HttpHeaders.AUTHORIZATION, "Bearer bad-token"))
                    .andExpect(status().isUnauthorized());

            verifyNoInteractions(profileService);
        }
    }

}
