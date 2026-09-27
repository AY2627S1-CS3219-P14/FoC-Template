package com.campuscouriers.user.security;

import java.util.List;

public record JwkSet(List<Jwk> keys) {
}
