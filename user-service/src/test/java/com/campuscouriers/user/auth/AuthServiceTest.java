package com.campuscouriers.user.auth;

import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.repository.AccountRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.campuscouriers.user.auth.dto.RegisterRequest;
import static com.campuscouriers.user.TestConstants.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Captor
    private ArgumentCaptor<Account> accountCaptor;

    @InjectMocks
    private AuthService authService;

    private final RegisterRequest request =
            new RegisterRequest(VALID_NAME, VALID_EMAIL, VALID_PASSWORD);

    @DisplayName("Before F1.3 - the service should hash the password and pass the account to the account repository")
    @Test
    void register_savesAccountWithHashedPassword() {

        when(passwordEncoder.encode(VALID_PASSWORD)).thenReturn("hashed-password");

        authService.register(request);

        verify(accountRepository).save(accountCaptor.capture());
        Account saved = accountCaptor.getValue();
        assertThat(saved.getEmail()).isEqualTo(VALID_EMAIL);
        assertThat(saved.getPasswordHash()).isEqualTo("hashed-password");

    }

}
