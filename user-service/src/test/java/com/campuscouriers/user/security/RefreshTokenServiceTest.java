package com.campuscouriers.user.security;

import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.AccountType;
import com.campuscouriers.user.entity.RefreshToken;
import com.campuscouriers.user.exception.InvalidRefreshTokenException;
import com.campuscouriers.user.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import static com.campuscouriers.user.TestConstants.VALID_EMAIL;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
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

    @DisplayName("F2.3.2 - the user service should issue longer-lived refresh tokens with a lifetime of 30 days")
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

    @DisplayName("F4.3 - the user service shall invalidate the refresh token upon redemption on rotation")
    @Test
    void redeem_withAValidToken_returnsTheAccountAndDeletesTheToken() {
        when(clock.instant()).thenReturn(now);
        when(tokenHasher.hash("raw-token")).thenReturn("hashed-value");
        RefreshToken stored = new RefreshToken("hashed-value", account, now.plus(Duration.ofDays(1)));
        when(refreshTokenRepository.findByTokenHash("hashed-value")).thenReturn(Optional.of(stored));

        Account result = refreshTokenService.redeem("raw-token");

        assertThat(result).isSameAs(account);
        verify(refreshTokenRepository).delete(stored);
    }

    @DisplayName("F4.1 - the user service should verify the submitted refresh token is valid and unexpired.")
    @Test
    void redeem_withAnUnknownToken_throws() {
        when(tokenHasher.hash("bad-token")).thenReturn("hashed-value");
        when(refreshTokenRepository.findByTokenHash("hashed-value")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshTokenService.redeem("bad-token"))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @DisplayName("F4.1.1 - the user service shall reject expired refresh tokens")
    @Test
    void redeem_withAnExpiredToken_throwsAndDeletesTheToken() {
        when(clock.instant()).thenReturn(now);
        when(tokenHasher.hash("old-token")).thenReturn("hashed-value");
        RefreshToken expired = new RefreshToken("hashed-value", account, now.minusSeconds(1));
        when(refreshTokenRepository.findByTokenHash("hashed-value")).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> refreshTokenService.redeem("old-token"))
                .isInstanceOf(InvalidRefreshTokenException.class);

        verify(refreshTokenRepository).delete(expired);
    }

    // F4.1.2 - the user service shall reject a refresh token that has already been used
    // this is implicitly fulfilled as used refresh tokens are deleted upon use on rotation
    // such used tokens will be caught as an unknown token as they cannot be found by the repository

}
