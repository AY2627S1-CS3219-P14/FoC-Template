package com.campuscouriers.user.repository;

import com.campuscouriers.user.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("delete from RefreshToken t where t.id = :id and t.expiresAt > :now")
    int consume(@Param("id") UUID id, @Param("now") Instant now);

    @Modifying
    @Query("delete from RefreshToken t where t.tokenHash = :tokenHash and t.account.id = :accountId")
    int revoke(@Param("tokenHash") String tokenHash, @Param("accountId") UUID accountId);
}
