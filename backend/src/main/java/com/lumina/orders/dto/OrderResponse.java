package com.lumina.orders.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNumber,
        String customerName,
        String customerEmail,
        String shippingAddress,
        String shippingCity,
        /** Suma de bases gravables (sin IVA) — se recalcula en el backend. */
        BigDecimal subtotal,
        /** IVA desglosado — se recalcula en el backend, nunca se confía en el frontend. */
        BigDecimal vatTotal,
        BigDecimal shippingCost,
        /** Base + IVA + envío (COP). */
        BigDecimal totalAmount,
        String status,
        LocalDateTime createdAt,
        List<OrderItemResponse> items
) {
}
