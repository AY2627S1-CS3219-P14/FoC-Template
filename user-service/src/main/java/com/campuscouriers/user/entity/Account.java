package com.campuscouriers.user.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.util.UUID;

@Entity
@Table(name = "accounts")
@Getter
public class Account {

    // Getters
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    private Role type;
    private String email;
    private String passwordHash;

    protected Account() {}  // required by JPA

    public Account(Role type, String email, String passwordHash) {
        this.type = type;
        this.email = email;
        this.passwordHash = passwordHash;
    }

}
