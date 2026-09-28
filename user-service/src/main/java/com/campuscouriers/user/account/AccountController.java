package com.campuscouriers.user.account;

import com.campuscouriers.user.account.dto.AccountResponse;
import com.campuscouriers.user.account.dto.UpdateAccountTypeRequest;
import com.campuscouriers.user.exception.InsufficientPermissionException;
import com.campuscouriers.user.exception.InvalidAccountException;
import com.campuscouriers.user.exception.LastAdministratorException;
import com.campuscouriers.user.security.access.AccessTokenClaims;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

// Only PATCH is mapped; other methods on /{accountId} are rejected by Spring MVC with 405
@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PatchMapping("/{accountId}")
    public AccountResponse updateType(@PathVariable UUID accountId,
                                      @Valid @RequestBody UpdateAccountTypeRequest request,
                                      @AuthenticationPrincipal AccessTokenClaims claims) {
        return accountService.updateType(accountId, request.accountType(), claims);
    }

    // For when the target account does not exist
    @ExceptionHandler(InvalidAccountException.class)
    public ProblemDetail handleInvalidAccount(InvalidAccountException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // For when the caller is not an Administrator, or is modifying their own account
    @ExceptionHandler(InsufficientPermissionException.class)
    public ProblemDetail handleInsufficientPermission(InsufficientPermissionException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    // For when a demotion would leave zero administrators
    @ExceptionHandler(LastAdministratorException.class)
    public ProblemDetail handleLastAdministrator(LastAdministratorException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

}
