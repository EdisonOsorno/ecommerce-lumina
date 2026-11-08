package com.lumina.catalog.dto;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Vista administrativa completa de un producto (Fase 5C): datos públicas
 * del catálogo + categoria + estado del inventario inicial. Incluye
 * productos activos E inactivos (soft delete por INVIMA/descontinuación).
 */
public record AdminProductResponse(
        Long id,
        String name,
        String slug,
        String sku,
        Long categoryId,
        String categoryName,
        BigDecimal price,
        BigDecimal compareAtPrice,
        BigDecimal vatRate,
        String imageUrl,
        boolean active,
        boolean featured,
        int availableQuantity,
        Instant createdAt
) {
}
