package com.campuscouriers.supplier.exception;

public class DuplicateCategoryException extends RuntimeException {

    public DuplicateCategoryException(String name) {
        super("A category named '" + name + "' already exists");
    }
}
