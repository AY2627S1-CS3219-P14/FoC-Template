package com.campuscouriers.user.exception;

public class LastAdministratorException extends RuntimeException {

    public LastAdministratorException() {
        super("At least one administrator must remain");
    }

}
