package com.campuscouriers.user.profile;

import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.AccountType;
import com.campuscouriers.user.entity.Profile;
import com.campuscouriers.user.exception.InvalidProfileException;
import com.campuscouriers.user.profile.dto.ProfileResponse;
import com.campuscouriers.user.repository.ProfileRepository;
import com.campuscouriers.user.security.access.AccessTokenClaims;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static com.campuscouriers.user.TestConstants.VALID_EMAIL;
import static com.campuscouriers.user.TestConstants.VALID_NAME;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ProfileServiceTest {

    @Mock private ProfileRepository profileRepository;

    @InjectMocks private ProfileService profileService;

    private final UUID ownerId = new UUID(0L, 1L);
    private final UUID otherId = new UUID(0L, 2L);

    private final AccessTokenClaims owner = new AccessTokenClaims(ownerId, VALID_EMAIL, AccountType.Student);
    private final AccessTokenClaims otherStudent = new AccessTokenClaims(otherId, "bob@u.nus.edu", AccountType.Student);
    private final AccessTokenClaims administrator = new AccessTokenClaims(otherId, "admin@u.nus.edu", AccountType.Administrator);

    @DisplayName("F5.1 - The user service shall return the profile to the profile owner or an administrator")
    @Nested
    class GetProfileTests {

        @Test
        void getProfile_asOwner_returnsNameAndEmail() {
            when(profileRepository.findById(ownerId)).thenReturn(Optional.of(profileFor(ownerId)));

            ProfileResponse response = profileService.getProfile(ownerId, owner);

            assertThat(response).isEqualTo(new ProfileResponse(VALID_NAME, VALID_EMAIL));
        }

        @Test
        void getProfile_asAdministrator_returnsAnotherUsersProfile() {
            when(profileRepository.findById(ownerId)).thenReturn(Optional.of(profileFor(ownerId)));

            ProfileResponse response = profileService.getProfile(ownerId, administrator);

            assertThat(response).isEqualTo(new ProfileResponse(VALID_NAME, VALID_EMAIL));
        }

        @Test
        void getProfile_asNonOwnerStudent_throwsWithoutQueryingTheRepository() {
            assertThatThrownBy(() -> profileService.getProfile(ownerId, otherStudent))
                    .isInstanceOf(InvalidProfileException.class);

            verifyNoInteractions(profileRepository);
        }

        @Test
        void getProfile_asOwnerWithMissingProfile_throws() {
            when(profileRepository.findById(ownerId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> profileService.getProfile(ownerId, owner))
                    .isInstanceOf(InvalidProfileException.class);
        }

        @Test
        void getProfile_asAdministratorWithMissingProfile_throws() {
            when(profileRepository.findById(ownerId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> profileService.getProfile(ownerId, administrator))
                    .isInstanceOf(InvalidProfileException.class);
        }
    }

    @DisplayName("F5.1 - The user service shall return to any authenticated user their own profile")
    @Nested
    class GetMyProfileTests {

        @Test
        void getMyProfile_returnsTheCallersProfile() {
            when(profileRepository.findById(ownerId)).thenReturn(Optional.of(profileFor(ownerId)));

            ProfileResponse response = profileService.getMyProfile(owner);

            assertThat(response).isEqualTo(new ProfileResponse(VALID_NAME, VALID_EMAIL));
        }

        @Test
        void getMyProfile_withMissingProfile_throws() {
            when(profileRepository.findById(ownerId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> profileService.getMyProfile(owner))
                    .isInstanceOf(InvalidProfileException.class);
        }
    }

    // ---- Helpers ----
    private static Profile profileFor(UUID accountId) {
        Account account = new Account(AccountType.Student, VALID_EMAIL, "hashed-password");
        ReflectionTestUtils.setField(account, "id", accountId);
        Profile profile = new Profile(account, VALID_NAME);
        ReflectionTestUtils.setField(profile, "id", accountId);
        return profile;
    }

}
