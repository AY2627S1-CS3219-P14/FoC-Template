package com.campuscouriers.user.account.dto;

import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.AccountType;

import java.util.UUID;

public record AccountResponse(
        UUID id,
        String email,
        AccountType type
) {

    public static AccountResponse from(Account account) {
        return new AccountResponse(account.getId(), account.getEmail(), account.getType());
    }

}
