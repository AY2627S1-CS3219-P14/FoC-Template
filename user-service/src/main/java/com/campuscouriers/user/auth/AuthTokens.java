package com.campuscouriers.user.auth;

// Tokens issued for a session; the controller returns the access token in the body and the refresh token as a cookie
public record AuthTokens(
        String accessToken,
        String refreshToken,
        long expiresIn
) {

}
