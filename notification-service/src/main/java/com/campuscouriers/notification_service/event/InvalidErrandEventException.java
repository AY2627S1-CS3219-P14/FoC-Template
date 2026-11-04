package com.campuscouriers.notification_service.event;

public class InvalidErrandEventException extends RuntimeException {
    public InvalidErrandEventException(String message) {
        super(message);
    }
}
