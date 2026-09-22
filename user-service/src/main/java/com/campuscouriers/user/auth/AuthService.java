package com.campuscouriers.user.auth;

import com.campuscouriers.user.auth.dto.RegisterRequest;
import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.Profile;
import com.campuscouriers.user.entity.Role;
import com.campuscouriers.user.repository.AccountRepository;
import com.campuscouriers.user.repository.ProfileRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

    public void register(RegisterRequest request) {

        Account account = new Account(
                Role.Student,   // to be changed later based on whether first user
                request.email(),
                passwordEncoder.encode(request.password())
        );

        Profile profile = new Profile(
                account,
                request.name()
        );

        accountRepository.save(account);
        profileRepository.save(profile);

    }

}
