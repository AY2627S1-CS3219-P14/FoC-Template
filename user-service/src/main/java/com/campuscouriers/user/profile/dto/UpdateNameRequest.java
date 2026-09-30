package com.campuscouriers.user.profile.dto;

import com.campuscouriers.user.validation.ValidName;

public record UpdateNameRequest(
        @ValidName String name
) {

}
