package com.campuscouriers.user.security;

import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.AccountType;
import com.campuscouriers.user.entity.RefreshToken;
import com.campuscouriers.user.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import static com.campuscouriers.user.TestConstants.VALID_EMAIL;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class RefreshTokenServiceTest {

    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private TokenHasher tokenHasher;
    @Mock private Clock clock;

    @Captor private ArgumentCaptor<RefreshToken> tokenCaptor;

    private RefreshTokenService refreshTokenService;

    private final Instant now = Instant.parse("2026-09-24T10:00:00Z");
    private final Account account = new Account(AccountType.Student, VALID_EMAIL, "hashes-password");

    @BeforeEach
    void createService() {
        refreshTokenService = new RefreshTokenService(refreshTokenRepository, tokenHasher, clock, "30d");
    }

    @Test
    void issue_savesAHashedTokenLinkedToTheAccountWithA30DayExpiry() {
        when(clock.instant()).thenReturn(now);
        when(tokenHasher.hash(anyString())).thenReturn("hashed-value");

        String rawToken = refreshTokenService.issue(account);

        verify(refreshTokenRepository).save(tokenCaptor.capture());
        RefreshToken saved = tokenCaptor.getValue();
        assertThat(saved.getTokenHash()).isEqualTo("hashed-value");
        assertThat(saved.getAccount()).isSameAs(account);
        assertThat(saved.getExpiresAt()).isEqualTo(now.plus(Duration.ofDays(30)));
        assertThat(rawToken).isNotBlank();
    }

}
