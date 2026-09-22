package com.campuscouriers.user.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.util.UUID;

@Entity
@Table(name = "profiles")
@Getter
public class Profile {

    @Id
    private UUID id;

    @OneToOne(optional = false)
    @MapsId
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private Account account;

    private String name;

    protected Profile() {}  // required by JPA

    public Profile(Account account, String name) {
        this.account = account;
        this.name = name;
    }

}
