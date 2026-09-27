package com.campuscouriers.user.auth;

import com.campuscouriers.user.auth.dto.LoginRequest;
import com.campuscouriers.user.auth.dto.LoginResponse;
import com.campuscouriers.user.auth.dto.LogoutRequest;
import com.campuscouriers.user.auth.dto.RefreshRequest;
import com.campuscouriers.user.exception.EmailAlreadyRegisteredException;
import com.campuscouriers.user.exception.InvalidCredentialsException;
import com.campuscouriers.user.exception.InvalidRefreshTokenException;
import com.campuscouriers.user.security.access.AccessTokenClaims;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.campuscouriers.user.auth.dto.RegisterRequest;

import jakarta.validation.Valid;

@RestController 
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
    @PostMapping("/refresh")
    public LoginResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    // Logs out the current device only; the frontend handles the redirect to the login page
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@AuthenticationPrincipal AccessTokenClaims claims, @Valid @RequestBody LogoutRequest request) {
        authService.logout(claims.accountId(), request);
    }

    // For when the duplicate email check returns false at the service level
    @ExceptionHandler(EmailAlreadyRegisteredException.class)
    public ProblemDetail handleDuplicateEmail(EmailAlreadyRegisteredException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

    // For when 2 concurrent requests pass the email duplicate check but fails DB unique constraint
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleUniqueConstraintRejection(DataIntegrityViolationException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                "The request could not be completed due to a conflict." // kept generic to prevent data leak
        );
    }

    // For when either the email or password is invalid for a login request
    @ExceptionHandler(InvalidCredentialsException.class)
    public ProblemDetail handleInvalidCredentials(InvalidCredentialsException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    // For when the old-token is invalid for a token refresh request
    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ProblemDetail handleInvalidRefreshToken(InvalidRefreshTokenException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }
    
}