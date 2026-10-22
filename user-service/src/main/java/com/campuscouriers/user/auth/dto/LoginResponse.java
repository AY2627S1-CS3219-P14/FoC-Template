package com.campuscouriers.user.auth.dto;

// The refresh token is not included here; it is set as an HttpOnly cookie instead
public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn
) {

    public LoginResponse(String accessToken, long expiresIn) {
        this(accessToken, "Bearer", expiresIn);
    }

}
