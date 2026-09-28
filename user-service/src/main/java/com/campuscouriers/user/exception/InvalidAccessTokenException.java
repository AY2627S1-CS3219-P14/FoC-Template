package com.campuscouriers.user.exception;

public class InvalidAccessTokenException extends RuntimeException{

    public InvalidAccessTokenException() {
        super("Invalid or expired access token");
    }

}
