package com.campuscouriers.user.account.dto;

import org.springframework.data.domain.Page;

import java.util.List;

// Same page shape as supplier-service's list endpoints, so the frontend handles both alike
public record AccountPageResponse(
        List<AccountSummaryResponse> items,
        PageInfo page
) {

    public record PageInfo(
            int number,
            int size,
            long totalElements,
            int totalPages,
            boolean hasNext,
            boolean hasPrevious
    ) {

    }

    public static AccountPageResponse from(Page<AccountSummaryResponse> page) {
        return new AccountPageResponse(page.getContent(), new PageInfo(
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.hasNext(),
                page.hasPrevious()));
    }

}
