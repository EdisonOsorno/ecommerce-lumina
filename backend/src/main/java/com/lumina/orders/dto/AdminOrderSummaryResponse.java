package com.lumina.orders.dto;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Resumen de una orden visto desde el backoffice (Fase 5A).
 * A diferencia del OrderSummaryResponse del cliente, incluye los datos
 * personales de contacto y ciudad de envío (visibles solo para ROLE_ADMIN).
 */
public record AdminOrderSummaryResponse(
        Long id,
        String orderNumber,
        String customerName,
        String customerEmail,
        String shippingCity,
        BigDecimal totalAmount,
        String status,
        Instant createdAt,
        /** Suma de cantidades de los items (unidades totales del pedido). */
        int itemsCount
) {
}
