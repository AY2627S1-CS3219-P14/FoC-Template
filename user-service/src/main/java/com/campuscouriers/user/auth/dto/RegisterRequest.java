package com.campuscouriers.user.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Size(max = 50) String name,
    @NotBlank @Email(
            regexp = "^[A-Za-z0-9._%+-]+@(.+\\.|yale-|duke-)?nus\\.edu(\\.sg)?$",
            message = "Email must belong to NUS domain"
    )
    String email,
    @NotBlank String password) {

}