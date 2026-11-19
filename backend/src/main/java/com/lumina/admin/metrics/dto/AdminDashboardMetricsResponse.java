package com.lumina.admin.metrics.dto;

import java.util.List;

/** Payload completo del dashboard de métricas del backoffice (Fase 5F). */
public record AdminDashboardMetricsResponse(
        FinancialSummaryResponse financialSummary,
        List<ProductSalesMetricResponse> topSellingProducts,
        List<ProductLowDemandMetricResponse> lowDemandProducts,
        List<OrderStatusBreakdownResponse> ordersByStatus) {
}
