package com.lumina.admin.metrics.dto;

import java.math.BigDecimal;

/** Producto más vendido en pedidos completados (Fase 5F). */
public record ProductSalesMetricResponse(
        Long productId,
        String productName,
        String sku,
        String categoryName,
        long unitsSold,
        BigDecimal totalRevenue,
        int currentStock) {
}
