package com.campuscouriers.user.account.dto;

import com.campuscouriers.user.entity.AccountType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

// type is kept as a String so only the exact accepted spellings pass validation (400 otherwise)
public record UpdateAccountTypeRequest(
        @NotNull @Pattern(regexp = "Student|student|Administrator|administrator") String type
) {

    public AccountType accountType() {
        return type.equalsIgnoreCase("student") ? AccountType.Student : AccountType.Administrator;
    }

}
