package com.campuscouriers.supplier.exception;

public class ActiveSuppliersAssignedException extends RuntimeException {

    public ActiveSuppliersAssignedException(String resourceType) {
        super(resourceType + " cannot be deactivated while active suppliers are assigned to it");
    }
}
