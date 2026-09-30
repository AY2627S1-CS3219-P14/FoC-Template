package com.campuscouriers.user.account;

import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.AccountType;
import com.campuscouriers.user.entity.Profile;
import com.campuscouriers.user.exception.EmailAlreadyRegisteredException;
import com.campuscouriers.user.repository.AccountRepository;
import com.campuscouriers.user.repository.ProfileRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

// Single code path for creating an account, shared by registration and the administrator bootstrap
@Service
public class AccountCreationService {

    private final AccountRepository accountRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    public AccountCreationService(
        AccountRepository accountRepository,
        ProfileRepository profileRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.accountRepository = accountRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Account create(AccountType type, String email, String rawPassword, String name) {

        String normalizedEmail = email.toLowerCase(Locale.ROOT);

        // Email Duplicate Check
        if (accountRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyRegisteredException();
        }

        // Create Account and Profile
        Account account = new Account(
                type,
                normalizedEmail,
                passwordEncoder.encode(rawPassword)
        );

        Profile profile = new Profile(
                account,
                name
        );

        // Persist Account and Profile to Database
        try {
            accountRepository.save(account);
        } catch (DataIntegrityViolationException ex) {
            throw new EmailAlreadyRegisteredException();
        }
        profileRepository.save(profile);

        return account;
    }

}
