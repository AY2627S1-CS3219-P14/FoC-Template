package com.campuscouriers.user.security;

import com.campuscouriers.user.entity.Account;
import io.jsonwebtoken.Jwts;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.convert.DurationStyle;
import org.springframework.stereotype.Service;

import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    private final PrivateKey privateKey;
    @Getter
    private final PublicKey publicKey;
    private final Clock clock;
    private final String issuer;
    @Getter
    private final Duration accessTokenTtl;

    public JwtService(PrivateKey privateKey,
                      PublicKey publicKey,
                      Clock clock,
                      @Value("${app.jwt.issuer}") String issuer,
                      @Value("${app.jwt.access-token-ttl}") String accessTokenTtl ) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.clock = clock;
        this.issuer = issuer;
        this.accessTokenTtl = DurationStyle.detectAndParse(accessTokenTtl);
    }

    public String generateAccessToken(Account account) {
        Instant now = clock.instant();
        return Jwts.builder()
                .subject(String.valueOf(account.getId()))
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenTtl)))
                .claim("email", account.getEmail())
                .claim("type", account.getType().name())
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }
}
