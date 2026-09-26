package com.campuscouriers.user.security;

import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.AccountType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.convert.DurationStyle;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.KeyPair;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static com.campuscouriers.user.TestConstants.VALID_EMAIL;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class JwtServiceTest {

    @Mock
    private Clock clock;

    private final Instant now = Instant.parse("2026-09-24T10:00:00Z");

    private KeyPair keyPair;
    private JwtService jwtService;

    @BeforeEach
    void createService() {
        keyPair = Jwts.SIG.RS256.keyPair().build();
        jwtService = new JwtService(keyPair.getPrivate(), keyPair.getPublic(), clock,
                "campuscouriers-user-service", "15m");
    }

    @Test
    void generateAccessToken_includesAccountIdEmailAndType() {
        when(clock.instant()).thenReturn(now);
        UUID mockUUID = new UUID(0L, 42L);
        Account account = accountWithId(mockUUID, VALID_EMAIL, AccountType.Student);

        String token = jwtService.generateAccessToken(account);

        Claims claims = Jwts.parser()
                .verifyWith(keyPair.getPublic())
                .clock(() -> Date.from(now.plus(DurationStyle.detectAndParse("5m"))))
                .build()
                .parseSignedClaims(token)
                .getPayload();

        assertThat(claims.getSubject()).isEqualTo(mockUUID.toString());
        assertThat(claims.getIssuer()).isEqualTo("campuscouriers-user-service");
        assertThat(claims.getIssuedAt().toInstant()).isEqualTo(now);
        assertThat(claims.getExpiration().toInstant()).isEqualTo(now.plus(Duration.ofMinutes(15)));
        assertThat(claims.get("email", String.class)).isEqualTo(VALID_EMAIL);
        assertThat(claims.get("type", String.class)).isEqualTo("Student");
    }

    private static Account accountWithId(UUID id, String email, AccountType type) {
        Account account = new Account(type, email, "hashed-password");
        ReflectionTestUtils.setField(account, "id", id);
        ReflectionTestUtils.setField(account, "type", type);
        return account;
    }

}
