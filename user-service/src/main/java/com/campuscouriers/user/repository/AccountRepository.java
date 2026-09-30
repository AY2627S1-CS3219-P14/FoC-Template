package com.campuscouriers.user.repository;

import com.campuscouriers.user.entity.Account;
import com.campuscouriers.user.entity.AccountType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {

    boolean existsByEmail(String email);
    Optional<Account> findByEmail(String email);
    boolean existsByType(AccountType type);

    // SELECT ... ORDER BY id FOR UPDATE: rows are locked in ascending id order, so concurrent callers serialize
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Account a where a.type = :type or a.id = :id order by a.id")
    List<Account> lockAllByTypeOrId(@Param("type") AccountType type, @Param("id") UUID id);

    // Blocks until this transaction holds the PostgreSQL advisory lock for the key; released on commit or rollback.
    // Selected FROM the function because pg_advisory_xact_lock returns void, which JDBC cannot map
    @Query(value = "select 1 from pg_advisory_xact_lock(:key)", nativeQuery = true)
    Integer acquireTransactionLock(@Param("key") long key);

}
