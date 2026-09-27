package com.campuscouriers.user.repository;

import com.campuscouriers.user.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {

    boolean existsByEmail(String email);
    Optional<Account> findByEmail(String email);

}
