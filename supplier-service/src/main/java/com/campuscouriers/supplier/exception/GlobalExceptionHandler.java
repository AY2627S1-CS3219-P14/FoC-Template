package com.campuscouriers.supplier.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateCategoryException.class)
    public ProblemDetail handleDuplicateCategory(DuplicateCategoryException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(DuplicateBuildingException.class)
    public ProblemDetail handleDuplicateBuilding(DuplicateBuildingException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(DuplicateSupplierException.class)
    public ProblemDetail handleDuplicateSupplier(DuplicateSupplierException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(ReferenceNotFoundException.class)
    public ProblemDetail handleReferenceNotFound(ReferenceNotFoundException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(ReferenceNotActiveException.class)
    public ProblemDetail handleReferenceNotActive(ReferenceNotActiveException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
    }
}
