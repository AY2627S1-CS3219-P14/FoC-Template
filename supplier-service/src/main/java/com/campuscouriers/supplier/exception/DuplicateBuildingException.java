package com.campuscouriers.supplier.exception;

public class DuplicateBuildingException extends RuntimeException {

    public DuplicateBuildingException(String name) {
        super("A building named '" + name + "' already exists");
    }
}
