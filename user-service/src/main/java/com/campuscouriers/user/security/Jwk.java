package com.campuscouriers.user.security;

public record Jwk(
        String kty,
        String use,
        String alg,
        String kid,
        String n,
        String e
) {

}
