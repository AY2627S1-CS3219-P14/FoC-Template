package com.campuscouriers.user.security;

import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.RefreshToken;
import com.campuscouriers.user.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.convert.DurationStyle;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenHasher tokenHasher;
    private final Clock clock;
    private final Duration ttl;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            TokenHasher tokenHasher,
            Clock clock,
            @Value("${app.jwt.refresh-token-ttl}") String ttl
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenHasher = tokenHasher;
        this.clock = clock;
        this.ttl = DurationStyle.detectAndParse(ttl);
    }

    public String issue(Account account) {
        String rawToken = UUID.randomUUID().toString();
        RefreshToken token = new RefreshToken(tokenHasher.hash(rawToken), account, clock.instant().plus(ttl));
        refreshTokenRepository.save(token);
        return rawToken;
    }

}
