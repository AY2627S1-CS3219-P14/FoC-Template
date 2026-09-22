package com.campuscouriers.user.auth;

import com.campuscouriers.user.exception.EmailAlreadyRegisteredException;
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

    @ExceptionHandler(EmailAlreadyRegisteredException.class)
    public ProblemDetail handleDuplicateEmail(EmailAlreadyRegisteredException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }
    
}