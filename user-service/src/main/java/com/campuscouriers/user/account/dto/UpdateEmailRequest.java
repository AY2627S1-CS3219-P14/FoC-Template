package com.campuscouriers.user.account.dto;

import com.campuscouriers.user.validation.NusEmail;

public record UpdateEmailRequest(
        @NusEmail String email
) {

}
