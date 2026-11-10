package com.campuscouriers.user.account.dto;

import com.campuscouriers.user.entity.AccountType;

import java.util.UUID;

// One row of the administrator account list. name is null if the account has no profile
public record AccountSummaryResponse(
        UUID id,
        String email,
        String name,
        AccountType type
) {

}
