package com.campuscouriers.credit.event;

import com.campuscouriers.credit.service.WalletService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class UserRegisteredListener {

    private final WalletService walletService;

    public UserRegisteredListener(WalletService walletService) {
        this.walletService = walletService;
    }

    @KafkaListener(topics = UserRegisteredEvent.TYPE, groupId = "credit-service")
    
    public void onUserRegistered(UserRegisteredEvent event) {
        walletService.createWallet(event.userId());
    }
}