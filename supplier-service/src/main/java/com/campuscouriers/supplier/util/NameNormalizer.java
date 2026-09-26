package com.campuscouriers.supplier.util;

import java.util.Locale;

public final class NameNormalizer {

    private NameNormalizer() {
    }

    public static String displayName(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    public static String normalizedName(String value) {
        return displayName(value).toLowerCase(Locale.ROOT);
    }
}
