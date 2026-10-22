package com.campuscouriers.user.event;

import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.AccountType;
import com.campuscouriers.user.entity.Profile;

import java.time.Instant;
import java.util.UUID;

// Published when a new user's Account and Profile are created; the field names are the contract with consumers
public record UserRegisteredEvent(
    UUID userId,
    AccountType type,
    String name,
    String email,
    Instant registeredAt
) {

    // Event type in the outbox, which is also the Kafka topic
    public static final String TYPE = "user.registered";

    public static UserRegisteredEvent from(Account account, Profile profile, Instant registeredAt) {
        return new UserRegisteredEvent(
                account.getId(),
                account.getType(),
                profile.getName(),
                account.getEmail(),
                registeredAt
        );
    }

}
