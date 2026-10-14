package com.campuscouriers.user.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
@Getter
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String tokenHash;

    @ManyToOne(optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false)
    private Instant expiresAt;

    protected RefreshToken() {} // required by JPA

    public RefreshToken(String tokenHash, Account account, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.account = account;
        this.expiresAt = expiresAt;
    }

}
