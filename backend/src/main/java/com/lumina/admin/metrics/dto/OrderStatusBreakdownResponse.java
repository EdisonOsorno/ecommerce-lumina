package com.lumina.admin.metrics.dto;

import com.lumina.orders.domain.OrderStatus;

import java.math.BigDecimal;

/** Desglose de pedidos por estado con etiqueta legible (Fase 5F). */
public record OrderStatusBreakdownResponse(
        OrderStatus status,
        String label,
        long count,
        BigDecimal totalAmount) {
}
