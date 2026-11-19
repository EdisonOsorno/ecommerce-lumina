package com.lumina.admin.metrics;

import com.lumina.admin.metrics.dto.AdminDashboardMetricsResponse;
import com.lumina.admin.metrics.service.AdminMetricsService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Métricas y analítica comercial del backoffice (Fase 5F). Protegido por la
 * regla /api/admin/** → hasRole("ADMIN") de SecurityConfig.
 */
@RestController
@RequestMapping(path = "/api/admin/metrics", produces = MediaType.APPLICATION_JSON_VALUE)
public class AdminMetricsController {

    private final AdminMetricsService adminMetricsService;

    public AdminMetricsController(AdminMetricsService adminMetricsService) {
        this.adminMetricsService = adminMetricsService;
    }

    /** Dashboard completo: resumen financiero, rankings y desglose por estado. */
    @GetMapping("/dashboard")
    public AdminDashboardMetricsResponse getDashboard() {
        return adminMetricsService.getDashboardMetrics();
    }
}
