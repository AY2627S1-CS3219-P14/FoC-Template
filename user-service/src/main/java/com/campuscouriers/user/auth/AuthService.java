package com.campuscouriers.user.auth;

import com.campuscouriers.user.auth.dto.RegisterRequest;
import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.Profile;
import com.campuscouriers.user.entity.Role;
import com.campuscouriers.user.exception.EmailAlreadyRegisteredException;
import com.campuscouriers.user.repository.AccountRepository;
import com.campuscouriers.user.repository.ProfileRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final AccountRepository accountRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
        AccountRepository accountRepository,
        ProfileRepository profileRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.accountRepository = accountRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void register(RegisterRequest request) {

        String email = request.email().toLowerCase(Locale.ROOT);

        // Email Duplicate Check
        if (accountRepository.existsByEmail(email)) {
            throw new EmailAlreadyRegisteredException();
        }

        // Set Role (if first user, it is Administrator, otherwise, Student)
        Role role = accountRepository.count() > 0 ? Role.Student : Role.Administrator;

        // Create Account and Profile
        Account account = new Account(
                role,
                email,
                passwordEncoder.encode(request.password())
        );

        Profile profile = new Profile(
                account,
                request.name()
        );

        // Persist Account and Profile to Database
        try {
            accountRepository.save(account);
        } catch (DataIntegrityViolationException ex) {
            throw new EmailAlreadyRegisteredException();
        }
        profileRepository.save(profile);

    }

}
