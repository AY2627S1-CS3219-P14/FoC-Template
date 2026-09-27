package com.campuscouriers.user.security.access;

import com.campuscouriers.user.entity.AccountType;

import java.util.UUID;

public record AccessTokenClaims(
        UUID accountId,
        String email,
        AccountType type
) {

    public AccessTokenClaims {
        if (accountId == null || email == null || email.isBlank() || type == null) {
            throw new IllegalArgumentException("Access token is missing required claims");
        }
    }

}
