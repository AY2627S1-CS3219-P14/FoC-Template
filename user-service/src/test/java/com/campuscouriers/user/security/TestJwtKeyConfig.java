package com.campuscouriers.user.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.security.*;

@Configuration
@Profile("test")
class TestJwtKeyConfig {

    private static final KeyPair KEY_PAIR = generateKeyPair();

    @Bean
    PrivateKey jwtSigningKey() {
        return KEY_PAIR.getPrivate();
    }

    @Bean
    PublicKey jwtVerificationKey() {
        return KEY_PAIR.getPublic();
    }

    private static KeyPair generateKeyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("RSA is not available", e);
        }
    }
}
