package com.campuscouriers.user.profile;

import com.campuscouriers.user.entity.AccountType;
import com.campuscouriers.user.entity.Profile;
import com.campuscouriers.user.exception.InvalidProfileException;
import com.campuscouriers.user.profile.dto.ProfileResponse;
import com.campuscouriers.user.repository.ProfileRepository;
import com.campuscouriers.user.security.access.AccessTokenClaims;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    // Available to the profile's owner and to Administrators
    @Transactional(readOnly = true)
    public ProfileResponse getProfile(UUID profileId, AccessTokenClaims caller) {

        // Profile shares its id with its Account (@MapsId), so ownership is an id comparison
        boolean isOwner = profileId.equals(caller.accountId());
        boolean isAdministrator = caller.type() == AccountType.Administrator;

        // Checked before the lookup so non-owners cannot probe which profiles exist
        if (!isOwner && !isAdministrator) {
            throw new InvalidProfileException();
        }

        return profileRepository.findById(profileId)
                .map(this::toResponse)
                .orElseThrow(InvalidProfileException::new);
    }

    // Available to any authenticated user, for their own profile only
    @Transactional(readOnly = true)
    public ProfileResponse getMyProfile(AccessTokenClaims caller) {
        return profileRepository.findById(caller.accountId())
                .map(this::toResponse)
                .orElseThrow(InvalidProfileException::new);
    }

    private ProfileResponse toResponse(Profile profile) {
        return new ProfileResponse(profile.getName(), profile.getAccount().getEmail());
    }

}
