package com.campuscouriers.user.auth;

import com.campuscouriers.user.account.AccountCreationService;
import com.campuscouriers.user.account.CreatedAccount;
import com.campuscouriers.user.auth.dto.LoginRequest;
import com.campuscouriers.user.auth.dto.RegisterRequest;
import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.AccountType;
import com.campuscouriers.user.event.UserEventPublisher;
import com.campuscouriers.user.event.UserRegisteredEvent;
import com.campuscouriers.user.exception.InvalidCredentialsException;
import com.campuscouriers.user.repository.AccountRepository;
import com.campuscouriers.user.security.access.JwtService;
import com.campuscouriers.user.security.refresh.RefreshTokenService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final AccountRepository accountRepository;
    private final AccountCreationService accountCreationService;
    private final PasswordEncoder passwordEncoder;

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    private final UserEventPublisher userEventPublisher;
    private final Clock clock;

    public AuthService(
        AccountRepository accountRepository,
        AccountCreationService accountCreationService,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        RefreshTokenService refreshTokenService,
        UserEventPublisher userEventPublisher,
        Clock clock
    ) {
        this.accountRepository = accountRepository;
        this.accountCreationService = accountCreationService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.userEventPublisher = userEventPublisher;
        this.clock = clock;
    }

    // Registration always creates a Student; administrators come from the bootstrap or a promotion.
    // Deliberately not @Transactional: create() commits on return, so the event is only published for persisted users
    public void register(RegisterRequest request) {
        CreatedAccount created =
                accountCreationService.create(AccountType.Student, request.email(), request.password(), request.name());

        userEventPublisher.publishUserRegistered(
                UserRegisteredEvent.from(created.account(), created.profile(), clock.instant()));
    }

    public AuthTokens login(LoginRequest request) {
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

        return issueSession(account);
    }

    private AuthTokens issueSession(Account account) {
        String accessToken = jwtService.generateAccessToken(account);
        String refreshToken = refreshTokenService.issue(account);
        return new AuthTokens(accessToken, refreshToken, jwtService.getAccessTokenTtl().toSeconds());
    }

    @Transactional
    public AuthTokens refresh(String rawRefreshToken) {
        Account account = refreshTokenService.redeem(rawRefreshToken);
        return issueSession(account);
    }

    @Transactional
    public void logout(UUID accountId, String rawRefreshToken) {
        refreshTokenService.revoke(rawRefreshToken, accountId);
    }

}
