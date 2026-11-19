package com.lumina.admin.metrics.dto;

import java.math.BigDecimal;

/**
 * Resumen financiero del negocio (Fase 5F).
 *
 * Ingresos reales = pedidos completados (PAID + SHIPPED + DELIVERED).
 * Pérdidas = cancelados + reembolsados. Los pendientes se informan aparte
 * porque aún no son ingreso ni pérdida.
 */
public record FinancialSummaryResponse(
        long completedOrdersCount,
        BigDecimal completedOrdersRevenue,
        long cancelledOrdersCount,
        BigDecimal cancelledOrdersLoss,
        long refundedOrdersCount,
        BigDecimal refundedOrdersLoss,
        long pendingOrdersCount,
        BigDecimal pendingOrdersTotal,
        BigDecimal netRevenue,
        BigDecimal totalLostRevenue) {
}
