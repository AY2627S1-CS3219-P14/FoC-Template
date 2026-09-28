package com.campuscouriers.supplier.dto;

import java.util.List;

public record ItemListResponse<T>(List<T> items) {
}
