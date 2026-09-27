package com.campuscouriers.user.exception;

public class InvalidProfileException extends RuntimeException {

    public InvalidProfileException() {
        super("Profile not found");  // kept generic: unauthorised and missing profiles are indistinguishable
    }

}
