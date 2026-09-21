package com.campuscouriers.user.auth;

import com.campuscouriers.user.auth.dto.RegisterRequest;
import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.repository.AccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AccountRepository accountRepository, PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void register(RegisterRequest request) {

        Account account = new Account(
                "Student",   // to be changed later based on whether first user
                request.email(),
                passwordEncoder.encode(request.password())
        );

        accountRepository.save(account);

    }

}
