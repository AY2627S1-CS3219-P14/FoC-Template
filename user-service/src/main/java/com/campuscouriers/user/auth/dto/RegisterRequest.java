package com.campuscouriers.user.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank @Size(max = 50) String name,

        @NotBlank @Email(
            regexp = "^[A-Za-z0-9._%+-]+@(.+\\.|yale-|duke-)?nus\\.edu(\\.sg)?$",
            message = "Email must belong to NUS domain"
        ) String email,

        @NotBlank
        @Size(min = 16, max = 128)
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).{8,64}$",
            message = ("Password must contain uppercase & lowercase characters, " +
                "special characters, numbers, " +
                "and have a minimum length of 16 characters " +
                "with a maximum length of 128 characters")
        ) String password

) {

}