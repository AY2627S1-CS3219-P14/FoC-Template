package com.campuscouriers.user.exception;

public class InvalidAccountException extends RuntimeException {

    public InvalidAccountException() {
        super("Account not found");
    }

}
