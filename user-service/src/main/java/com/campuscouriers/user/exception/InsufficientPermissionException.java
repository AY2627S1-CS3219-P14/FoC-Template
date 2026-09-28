package com.campuscouriers.user.exception;

public class InsufficientPermissionException extends RuntimeException {

    public InsufficientPermissionException() {
        super("Insufficient permission");
    }

}
