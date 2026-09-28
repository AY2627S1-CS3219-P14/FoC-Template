package com.campuscouriers.supplier.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

import java.util.UUID;

@Entity
@Table(name = "buildings")
@Getter
public class Building {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(name = "normalized_name", nullable = false, unique = true, length = 60)
    private String normalizedName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BuildingStatus status;

    protected Building() {
    }

    public Building(String name, String normalizedName) {
        this.name = name;
        this.normalizedName = normalizedName;
        this.status = BuildingStatus.ACTIVE;
    }
}
