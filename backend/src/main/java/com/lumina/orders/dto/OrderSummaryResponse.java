package com.lumina.orders.dto;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Resumen compacto de una orden para el historial "Mi Cuenta" del cliente.
 * No incluye datos personales ni desglose de items (eso se ve en el comprobante).
 */
public record OrderSummaryResponse(
        Long id,
        String orderNumber,
        Instant createdAt,
        BigDecimal totalAmount,
        String status,
        /** Suma de cantidades de los items (unidades totales del pedido). */
        int itemsCount
) {
}
