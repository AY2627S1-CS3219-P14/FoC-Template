package com.campuscouriers.user.auth;

import com.campuscouriers.user.auth.dto.LoginRequest;
import com.campuscouriers.user.auth.dto.LoginResponse;
import com.campuscouriers.user.auth.dto.RefreshRequest;
import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.Profile;
import com.campuscouriers.user.entity.AccountType;
import com.campuscouriers.user.exception.EmailAlreadyRegisteredException;
import com.campuscouriers.user.exception.InvalidCredentialsException;
import com.campuscouriers.user.repository.AccountRepository;
import com.campuscouriers.user.repository.ProfileRepository;
import com.campuscouriers.user.security.access.JwtService;
import com.campuscouriers.user.security.refresh.RefreshTokenService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.campuscouriers.user.auth.dto.RegisterRequest;

import java.time.Duration;
import java.util.Optional;

import static com.campuscouriers.user.TestConstants.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock private AccountRepository accountRepository;
    @Mock private ProfileRepository profileRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @Captor private ArgumentCaptor<Account> accountCaptor;
    @Captor private ArgumentCaptor<Profile> profileCaptor;

    @InjectMocks private AuthService authService;

    @Mock private JwtService jwtService;
    @Mock private RefreshTokenService refreshTokenService;

    private final RegisterRequest request =
            new RegisterRequest(VALID_NAME, VALID_EMAIL, VALID_PASSWORD);

    @DisplayName("F1.1.2 - Email shall not be allowed if there is an existing registration with the same email")
    @Nested
    class EmailDuplicateTests {

        @Test
        void register_whenEmailAlreadyRegistered_throwsAndSavesNothing() {
            when(accountRepository.existsByEmail(VALID_EMAIL)).thenReturn(true);

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(EmailAlreadyRegisteredException.class);

            verify(accountRepository, never()).save(any());
            verifyNoInteractions(profileRepository, passwordEncoder);
        }

        @Test
        void register_storesEmailInLowerCase() {
            authService.register(new RegisterRequest(VALID_NAME, DUPLICATE_EMAIL, VALID_PASSWORD));

            verify(accountRepository).save(accountCaptor.capture());
            assertThat(accountCaptor.getValue().getEmail()).isEqualTo(VALID_EMAIL);
        }

        @Test
        void register_treatsEmailCaseInsensitively() {
            when(accountRepository.existsByEmail(VALID_EMAIL)).thenReturn(true);

            assertThatThrownBy(() ->
                authService.register(new RegisterRequest(VALID_NAME, DUPLICATE_EMAIL, VALID_PASSWORD)))
                .isInstanceOf(EmailAlreadyRegisteredException.class);
        }
    }

    @DisplayName("F1.3.2 - the service should assign Student type by default, or Administrator if first user")
    @Nested
    class AccountTypeTests {
        @Test
        void register_savesUserAsStudentByDefault() {

            when(accountRepository.count()).thenReturn(1L);

            authService.register(request);

            verify(accountRepository).save(accountCaptor.capture());
            assertThat(accountCaptor.getValue().getType()).isEqualTo(AccountType.Student);

        }

        @Test
        void register_savesFirstUserAsAdministrator() {

            when(accountRepository.count()).thenReturn(0L);

            authService.register(request);

            verify(accountRepository).save(accountCaptor.capture());
            assertThat(accountCaptor.getValue().getType()).isEqualTo(AccountType.Administrator);

        }
    }

    @Test
    void register_savesAccountWithHashedPassword() {

        when(passwordEncoder.encode(VALID_PASSWORD)).thenReturn("hashed-password");

        authService.register(request);

        verify(accountRepository).save(accountCaptor.capture());
        Account saved = accountCaptor.getValue();
        assertThat(saved.getEmail()).isEqualTo(VALID_EMAIL);
        assertThat(saved.getPasswordHash()).isEqualTo("hashed-password");

    }

    @DisplayName("F1.3 - the service should create a profile for the user (linked to the account)")
    @Test
    void register_createProfileLinkedToNewAccount() {

        authService.register(request);

        verify(accountRepository).save(accountCaptor.capture());
        verify(profileRepository).save(profileCaptor.capture());

        Profile profile = profileCaptor.getValue();
        assertThat(profile.getName()).isEqualTo(VALID_NAME);
        assertThat(profile.getAccount()).isSameAs(accountCaptor.getValue());

    }

    @DisplayName("F2.1 - the user service should verify that the user for the email exists")
    @Test
    void login_withUnknownEmail_throwsAndStillHashesThePassword() {

        when(accountRepository.findByEmail("nobody@u.nus.edu")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@u.nus.edu", "whatever")))
                .isInstanceOf(InvalidCredentialsException.class);

        verify(passwordEncoder).encode("whatever");

    }

    @DisplayName("F2.2 - the user service shall verify the submitted password hash against the stored password hash")
    @Test
    void login_withWrongPassword_throwsTheSameGenericError() {
        Account account = new Account(AccountType.Student, VALID_EMAIL, "hashed");
        when(accountRepository.findByEmail(VALID_EMAIL)).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("wrong-password", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest(VALID_EMAIL, "wrong-password")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    // F2.2.1 is implicitly fulfilled through BCryptPasswordEncoder.matches() comparing in constant time
    // BCrypt.checkpw checks every byte instead of stopping at the first difference

    // F2.2.2 is implicitly fulfilled through the use of InvalidCredentialsException.java

    @DisplayName("F2.3 - the user service shall issue a full session upon successful verification")
    @Test
    void login_withCorrectCredentials_returnsAccessAndRefreshTokens() {
        Account account = new Account(AccountType.Student, VALID_EMAIL, "hashed");
        when(accountRepository.findByEmail(VALID_EMAIL)).thenReturn(Optional.of(account));
        when(passwordEncoder.matches(VALID_PASSWORD, "hashed")).thenReturn(true);
        when(jwtService.generateAccessToken(account)).thenReturn("signed.jwt.token");
        when(jwtService.getAccessTokenTtl()).thenReturn(Duration.ofMinutes(15));
        when(refreshTokenService.issue(account)).thenReturn("raw-refresh-token");

        LoginResponse response = authService.login(new LoginRequest(VALID_EMAIL, VALID_PASSWORD));

        assertThat(response.accessToken()).isEqualTo("signed.jwt.token");
        assertThat(response.refreshToken()).isEqualTo("raw-refresh-token");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(900L);
    }

    @DisplayName("F4 - the user service shall allow users to refresh their tokens")
    @Test
    void refresh_withAValidToken_returnsNewTokens() {
        Account account = new Account(AccountType.Student, VALID_EMAIL, "hashed");
        when(refreshTokenService.redeem("old-refresh-token")).thenReturn(account);
        when(jwtService.generateAccessToken(account)).thenReturn("new-access-token");
        when(jwtService.getAccessTokenTtl()).thenReturn(Duration.ofMinutes(15));
        when(refreshTokenService.issue(account)).thenReturn("new-refresh-token");

        LoginResponse response = authService.refresh(new RefreshRequest("old-refresh-token"));

        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(response.refreshToken()).isEqualTo("new-refresh-token");
    }   // Uses redemption from the RefreshTokenService

}
