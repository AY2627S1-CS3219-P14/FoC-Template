package com.campuscouriers.user.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

public class TokenHasherTest {

    private final TokenHasher tokenHasher = new TokenHasher();

    @Test
    void hash_isDeterministic() {
        assertThat(tokenHasher.hash("abc-123")).isEqualTo(tokenHasher.hash("abc-123"));
    }

    @Test
    void hash_differsForDifferentInput() {
        assertThat(tokenHasher.hash("abc-123")).isNotEqualTo(tokenHasher.hash("abc-124"));
    }

    @Test
    void hash_doesNotReturnTheRawToken() {
        assertThat(tokenHasher.hash("abc-123")).isNotEqualTo("abc-123");
    }

}
