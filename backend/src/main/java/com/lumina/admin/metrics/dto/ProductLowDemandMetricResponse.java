package com.lumina.admin.metrics.dto;

/**
 * Producto activo con baja rotación (Fase 5F).
 *
 * demandLevel: "SIN_VENTAS" si no registra unidades en pedidos completados,
 * "BAJA_ROTACION" si vendió pocas unidades.
 */
public record ProductLowDemandMetricResponse(
        Long productId,
        String productName,
        String sku,
        String categoryName,
        long unitsSold,
        int currentStock,
        String demandLevel) {
}
