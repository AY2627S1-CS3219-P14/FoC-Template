package com.campuscouriers.supplier.exception;

public class ReferenceNotActiveException extends RuntimeException {

    public ReferenceNotActiveException(String referenceType) {
        super("The selected " + referenceType.toLowerCase() + " is not active");
    }
}
