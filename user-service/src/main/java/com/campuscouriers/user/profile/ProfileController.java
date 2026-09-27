package com.campuscouriers.user.profile;

import com.campuscouriers.user.exception.InvalidProfileException;
import com.campuscouriers.user.profile.dto.ProfileResponse;
import com.campuscouriers.user.security.access.AccessTokenClaims;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    public ProfileResponse getMyProfile(@AuthenticationPrincipal AccessTokenClaims claims) {
        return profileService.getMyProfile(claims);
    }

    @GetMapping("/{profileId}")
    public ProfileResponse getProfile(@PathVariable UUID profileId, @AuthenticationPrincipal AccessTokenClaims claims) {
        return profileService.getProfile(profileId, claims);
    }

    // For when the caller is neither the owner nor an Administrator, or the profile does not exist
    @ExceptionHandler(InvalidProfileException.class)
    public ProblemDetail handleInvalidProfile(InvalidProfileException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

}
