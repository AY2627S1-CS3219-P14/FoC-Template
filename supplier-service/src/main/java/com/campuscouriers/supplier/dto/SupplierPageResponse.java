package com.campuscouriers.supplier.dto;

import java.util.List;

public record SupplierPageResponse(List<SupplierResponse> items, PageMetadata page) {
}
