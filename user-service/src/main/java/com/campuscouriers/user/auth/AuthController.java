package com.campuscouriers.user.auth;

import com.campuscouriers.user.auth.dto.LoginRequest;
import com.campuscouriers.user.exception.EmailAlreadyRegisteredException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
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
    public void login(@Valid @RequestBody LoginRequest request) {}

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
    
}