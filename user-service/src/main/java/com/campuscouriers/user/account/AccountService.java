package com.campuscouriers.user.account;

import com.campuscouriers.user.account.dto.AccountResponse;
import com.campuscouriers.user.account.dto.EmailResponse;
import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.AccountType;
import com.campuscouriers.user.exception.EmailAlreadyRegisteredException;
import com.campuscouriers.user.exception.InsufficientPermissionException;
import com.campuscouriers.user.exception.InvalidAccountException;
import com.campuscouriers.user.exception.LastAdministratorException;
import com.campuscouriers.user.repository.AccountRepository;
import com.campuscouriers.user.security.access.AccessTokenClaims;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    // Available to Administrators only, and never on their own account
    @Transactional
    public AccountResponse updateType(UUID accountId, AccountType newType, AccessTokenClaims caller) {

        // Permission checks come first so 403 takes precedence over 404/409
        if (caller.type() != AccountType.Administrator || accountId.equals(caller.accountId())) {
            throw new InsufficientPermissionException();
        }

        // Locks every Administrator row and the target row (ascending id order) until commit,
        // so concurrent demotions are serialized and cannot together remove every administrator
        List<Account> locked = accountRepository.lockAllByTypeOrId(AccountType.Administrator, accountId);

        Account target = locked.stream()
                .filter(account -> account.getId().equals(accountId))
                .findFirst()
                .orElseThrow(InvalidAccountException::new);

        if (target.getType() == newType) {
            return AccountResponse.from(target);
        }

        // Counted from the locked rows rather than the caller's token, which may be stale
        if (target.getType() == AccountType.Administrator) {
            long remainingAdministrators = locked.stream()
                    .filter(account -> account.getType() == AccountType.Administrator)
                    .filter(account -> !account.getId().equals(accountId))
                    .count();
            if (remainingAdministrators == 0) {
                throw new LastAdministratorException();
            }
        }

        target.changeType(newType);  // flushed on commit
        return AccountResponse.from(target);
    }

    // Available to the account's owner only
    @Transactional
    public EmailResponse updateEmail(UUID accountId, String email, AccessTokenClaims caller) {

        // Checked before the lookup so non-owners cannot probe which accounts exist
        if (!accountId.equals(caller.accountId())) {
            throw new InsufficientPermissionException();
        }

        Account account = accountRepository.findById(accountId)
                .orElseThrow(InvalidAccountException::new);

        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        if (normalizedEmail.equals(account.getEmail())) {
            return new EmailResponse(account.getEmail());
        }

        if (accountRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyRegisteredException();
        }

        account.changeEmail(normalizedEmail);

        // Flushed here so a concurrent request claiming the same email fails the unique constraint as a 409
        try {
            accountRepository.saveAndFlush(account);
        } catch (DataIntegrityViolationException ex) {
            throw new EmailAlreadyRegisteredException();
        }

        return new EmailResponse(account.getEmail());
    }

}
