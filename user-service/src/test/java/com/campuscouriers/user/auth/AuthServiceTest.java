package com.campuscouriers.user.auth;

import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.Profile;
import com.campuscouriers.user.entity.AccountType;
import com.campuscouriers.user.exception.EmailAlreadyRegisteredException;
import com.campuscouriers.user.repository.AccountRepository;
import com.campuscouriers.user.repository.ProfileRepository;
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

}
