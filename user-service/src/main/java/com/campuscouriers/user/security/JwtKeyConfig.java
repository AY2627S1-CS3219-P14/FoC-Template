package com.campuscouriers.user.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Configuration
public class JwtKeyConfig {

    @Bean
    PrivateKey jwtSigningKey(@Value("${app.jwt.private-key-location}") Resource privateKeyResource)
        throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
        return KeyFactory.getInstance("RSA")
                .generatePrivate(new PKCS8EncodedKeySpec(decodePem(privateKeyResource)));
    }

    @Bean
    PublicKey jwtVerificationKey(@Value("${app.jwt.public-key-location}") Resource publicKeyResource)
        throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
        return KeyFactory.getInstance("RSA")
                .generatePublic(new X509EncodedKeySpec(decodePem(publicKeyResource)));
    }

    private byte[] decodePem(Resource resource) throws IOException {
        String pem = new String(resource.getInputStream().readAllBytes())
                .replaceAll("-----BEGIN (.*)-----", "")
                .replaceAll("-----END (.*)-----", "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(pem);
    }

}
