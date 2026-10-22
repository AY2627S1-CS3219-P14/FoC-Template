package com.campuscouriers.credit.dto;

import com.campuscouriers.credit.entity.Wallet;

public record WalletBalanceResponse(
        long availableBalance
) {
    public static WalletBalanceResponse from(Wallet wallet) {
        return new WalletBalanceResponse(wallet.getAvailableBalance());
    }
}