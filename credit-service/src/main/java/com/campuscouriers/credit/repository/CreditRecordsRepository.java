package com.campuscouriers.credit.repository;

import com.campuscouriers.credit.entity.CreditRecords;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CreditRecordsRepository extends JpaRepository<CreditRecords, UUID> {
    Page<CreditRecords> findByWalletIdOrderByOccurredAtDesc(UUID walletId, Pageable pageable);
}