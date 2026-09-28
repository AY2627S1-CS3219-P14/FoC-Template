package com.campuscouriers.supplier.exception;

public class DuplicateSupplierException extends RuntimeException {

    public DuplicateSupplierException(String name) {
        super("A supplier named '" + name + "' already exists at this building");
    }
}
