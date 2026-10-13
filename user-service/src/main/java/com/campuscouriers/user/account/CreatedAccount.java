package com.campuscouriers.user.account;

import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.Profile;

// The persisted Account and Profile from AccountCreationService.create
public record CreatedAccount(Account account, Profile profile) {
}
