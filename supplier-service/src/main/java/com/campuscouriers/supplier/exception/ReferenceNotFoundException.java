package com.campuscouriers.supplier.exception;

import java.util.UUID;

public class ReferenceNotFoundException extends RuntimeException {

    public ReferenceNotFoundException(String referenceType, UUID id) {
        super(referenceType + " with ID " + id + " was not found");
    }
}
