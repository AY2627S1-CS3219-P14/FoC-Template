package com.campuscouriers.user.account;

import com.campuscouriers.user.account.dto.AccountResponse;
import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.AccountType;
import com.campuscouriers.user.exception.InsufficientPermissionException;
import com.campuscouriers.user.exception.InvalidAccountException;
import com.campuscouriers.user.exception.LastAdministratorException;
import com.campuscouriers.user.repository.AccountRepository;
import com.campuscouriers.user.security.access.AccessTokenClaims;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.UUID;

import static com.campuscouriers.user.TestConstants.VALID_EMAIL;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AccountServiceTest {

    @Mock private AccountRepository accountRepository;

    @InjectMocks private AccountService accountService;

    private final UUID callerId = new UUID(0L, 1L);
    private final UUID targetId = new UUID(0L, 2L);
    private final UUID otherAdminId = new UUID(0L, 3L);

    private final AccessTokenClaims administrator =
            new AccessTokenClaims(callerId, "admin@u.nus.edu", AccountType.Administrator);
    private final AccessTokenClaims student =
            new AccessTokenClaims(callerId, "bob@u.nus.edu", AccountType.Student);

    @DisplayName("Only Administrators may change account types, and never their own")
    @Nested
    class PermissionTests {

        @ParameterizedTest
        @EnumSource(AccountType.class)
        void updateType_asStudent_throwsWithoutQueryingTheRepository(AccountType requested) {
            assertThatThrownBy(() -> accountService.updateType(targetId, requested, student))
                    .isInstanceOf(InsufficientPermissionException.class);

            verifyNoInteractions(accountRepository);
        }

        @ParameterizedTest
        @EnumSource(AccountType.class)
        void updateType_asAdministratorOnOwnAccount_throwsWithoutQueryingTheRepository(AccountType requested) {
            assertThatThrownBy(() -> accountService.updateType(callerId, requested, administrator))
                    .isInstanceOf(InsufficientPermissionException.class);

            verifyNoInteractions(accountRepository);
        }
    }

    @DisplayName("The target account shall exist")
    @Test
    void updateType_withMissingAccount_throws() {
        when(accountRepository.lockAllByTypeOrId(AccountType.Administrator, targetId))
                .thenReturn(List.of(account(callerId, AccountType.Administrator)));

        assertThatThrownBy(() -> accountService.updateType(targetId, AccountType.Administrator, administrator))
                .isInstanceOf(InvalidAccountException.class);
    }

    @DisplayName("Administrators may promote and demote other accounts")
    @Nested
    class ChangeTypeTests {

        @Test
        void updateType_promotingStudent_changesTypeToAdministrator() {
            Account target = account(targetId, AccountType.Student);
            when(accountRepository.lockAllByTypeOrId(AccountType.Administrator, targetId))
                    .thenReturn(List.of(account(callerId, AccountType.Administrator), target));

            AccountResponse response = accountService.updateType(targetId, AccountType.Administrator, administrator);

            assertThat(target.getType()).isEqualTo(AccountType.Administrator);
            assertThat(response).isEqualTo(new AccountResponse(targetId, VALID_EMAIL, AccountType.Administrator));
            verify(accountRepository).lockAllByTypeOrId(AccountType.Administrator, targetId);
        }

        @Test
        void updateType_demotingAdministratorWithOthersRemaining_changesTypeToStudent() {
            Account target = account(targetId, AccountType.Administrator);
            when(accountRepository.lockAllByTypeOrId(AccountType.Administrator, targetId))
                    .thenReturn(List.of(account(callerId, AccountType.Administrator), target));

            AccountResponse response = accountService.updateType(targetId, AccountType.Student, administrator);

            assertThat(target.getType()).isEqualTo(AccountType.Student);
            assertThat(response).isEqualTo(new AccountResponse(targetId, VALID_EMAIL, AccountType.Student));
        }

        @ParameterizedTest
        @EnumSource(AccountType.class)
        void updateType_withTheSameType_returnsTheAccountUnchanged(AccountType type) {
            Account target = account(targetId, type);
            when(accountRepository.lockAllByTypeOrId(AccountType.Administrator, targetId))
                    .thenReturn(List.of(account(callerId, AccountType.Administrator), target));

            AccountResponse response = accountService.updateType(targetId, type, administrator);

            assertThat(target.getType()).isEqualTo(type);
            assertThat(response).isEqualTo(new AccountResponse(targetId, VALID_EMAIL, type));
        }
    }

    @DisplayName("A demotion shall not leave zero administrators")
    @Nested
    class LastAdministratorTests {

        // e.g. the caller's token still says Administrator but they have since been demoted
        @Test
        void updateType_demotingTheLastAdministrator_throwsAndLeavesTypeUnchanged() {
            Account target = account(targetId, AccountType.Administrator);
            when(accountRepository.lockAllByTypeOrId(AccountType.Administrator, targetId))
                    .thenReturn(List.of(target));

            assertThatThrownBy(() -> accountService.updateType(targetId, AccountType.Student, administrator))
                    .isInstanceOf(LastAdministratorException.class);

            assertThat(target.getType()).isEqualTo(AccountType.Administrator);
        }

        @Test
        void updateType_demotingWithAnotherAdministratorRemaining_succeeds() {
            Account target = account(targetId, AccountType.Administrator);
            when(accountRepository.lockAllByTypeOrId(AccountType.Administrator, targetId))
                    .thenReturn(List.of(target, account(otherAdminId, AccountType.Administrator)));

            accountService.updateType(targetId, AccountType.Student, administrator);

            assertThat(target.getType()).isEqualTo(AccountType.Student);
        }
    }

    // ---- Helpers ----
    private static Account account(UUID id, AccountType type) {
        Account account = new Account(type, VALID_EMAIL, "hashed-password");
        ReflectionTestUtils.setField(account, "id", id);
        return account;
    }

}
