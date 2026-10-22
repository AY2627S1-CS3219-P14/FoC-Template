package com.campuscouriers.credit.event;

import java.util.UUID;


public record UserRegisteredEvent(
        UUID userId,
        String type
) {

    public static final String TYPE = "user.registered";
}