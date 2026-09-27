package com.campuscouriers.user.auth;

import com.campuscouriers.user.auth.dto.LoginRequest;
import com.campuscouriers.user.auth.dto.LoginResponse;
import com.campuscouriers.user.auth.dto.RegisterRequest;
import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.Profile;
import com.campuscouriers.user.entity.AccountType;
import com.campuscouriers.user.exception.EmailAlreadyRegisteredException;
import com.campuscouriers.user.exception.InvalidCredentialsException;
import com.campuscouriers.user.repository.AccountRepository;
import com.campuscouriers.user.repository.ProfileRepository;
import com.campuscouriers.user.security.JwtService;
import com.campuscouriers.user.security.RefreshTokenService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

@Service
public class AuthService {

    private final AccountRepository accountRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(
        AccountRepository accountRepository,
        ProfileRepository profileRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        RefreshTokenService refreshTokenService
    ) {
        this.accountRepository = accountRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional
    public void register(RegisterRequest request) {

        String email = request.email().toLowerCase(Locale.ROOT);

        // Email Duplicate Check
        if (accountRepository.existsByEmail(email)) {
            throw new EmailAlreadyRegisteredException();
        }

        // Set Role (if first user, it is Administrator, otherwise, Student)
        AccountType role = accountRepository.count() > 0 ? AccountType.Student : AccountType.Administrator;

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

    public LoginResponse login(LoginRequest request) {
        String email = request.email().toLowerCase(Locale.ROOT);
        Optional<Account> maybeAccount = accountRepository.findByEmail(email);

        if (maybeAccount.isEmpty()) {
            passwordEncoder.encode(request.password()); // to avoid side-channel attacks detecting the faster response
            throw new InvalidCredentialsException();
        }

        Account account = maybeAccount.get();
        if (!passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        throw new InvalidCredentialsException();    // for now
    }

}
