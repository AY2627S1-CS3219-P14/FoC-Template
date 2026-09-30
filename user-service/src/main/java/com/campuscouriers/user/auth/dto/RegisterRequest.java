package com.campuscouriers.user.auth.dto;

import com.campuscouriers.user.validation.NusEmail;
import com.campuscouriers.user.validation.ValidName;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @ValidName String name,

        @NusEmail String email,

        @NotBlank
        @Size(min = 16, max = 128)
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).{16,128}$",
            message = ("Password must contain uppercase & lowercase characters, " +
                "special characters, numbers, " +
                "and have a minimum length of 16 characters " +
                "with a maximum length of 128 characters")
        ) String password

) {

}