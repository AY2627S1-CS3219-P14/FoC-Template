package com.campuscouriers.user.security;

import com.campuscouriers.user.entity.AccountType;

import java.util.UUID;

public record AccessTokenClaims(
        UUID accountId,
        String email,
        AccountType type
) {

}
