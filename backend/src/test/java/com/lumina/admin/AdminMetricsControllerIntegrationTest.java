package com.lumina.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina.catalog.repository.ProductRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests de integración del dashboard de métricas (Fase 5F): regla ROLE_ADMIN,
 * estructura del payload y exactitud del resumen financiero tras crear un
 * pedido pagado, uno cancelado y uno reembolsado (lo que además valida la
 * migración V6 y el nuevo estado REFUNDED).
 *
 * Comparte la H2 del contexto de tests: usa SKUs que ninguna otra suite
 * consulta (LUM-FAC-004, LUM-COR-002, LUM-FAC-002) y mide deltas contra una
 * lectura inicial del propio dashboard para no depender del orden de ejecución.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminMetricsControllerIntegrationTest {

    private static final String ADMIN_EMAIL = "admin@lumina.demo";
    private static final String ADMIN_PASSWORD = "AdminLumina2026!";
    private static final String CUSTOMER_PASSWORD = "ContrasenaFuerte2026";

    private static final String DASHBOARD_URL = "/api/admin/metrics/dashboard";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;

    // ------------------------------------------------------------------
    // 1) Sin token → 403 Forbidden
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/admin/metrics/dashboard - Sin token responde 403")
    void shouldRejectMetricsWithoutToken() throws Exception {
        mockMvc.perform(get(DASHBOARD_URL))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------
    // 2) Token de ROLE_CUSTOMER → 403 Forbidden
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/admin/metrics/dashboard - Cliente común recibe 403")
    void shouldRejectMetricsForCustomerToken() throws Exception {
        String customerToken = registerAndReturnToken(
                "Métricas Curioso", "metrics.curioso@example.com");

        mockMvc.perform(get(DASHBOARD_URL)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------
    // 3) Token de ROLE_ADMIN → 200 con estructura completa del dashboard
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/admin/metrics/dashboard - Admin recibe el dashboard completo")
    void shouldReturnDashboardForAdmin() throws Exception {
        String adminToken = loginAdminAndReturnToken();

        mockMvc.perform(get(DASHBOARD_URL)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.financialSummary", notNullValue()))
                .andExpect(jsonPath("$.financialSummary.completedOrdersCount").isNumber())
                .andExpect(jsonPath("$.financialSummary.completedOrdersRevenue").isNumber())
                .andExpect(jsonPath("$.financialSummary.cancelledOrdersLoss").isNumber())
                .andExpect(jsonPath("$.financialSummary.refundedOrdersLoss").isNumber())
                .andExpect(jsonPath("$.financialSummary.netRevenue").isNumber())
                .andExpect(jsonPath("$.financialSummary.totalLostRevenue").isNumber())
                .andExpect(jsonPath("$.topSellingProducts").isArray())
                .andExpect(jsonPath("$.lowDemandProducts").isArray())
                .andExpect(jsonPath("$.ordersByStatus").isArray());
    }

    // ------------------------------------------------------------------
    // 4) Exactitud: pedido PAID, CANCELLED y REFUNDED impactan el resumen
    //    con los conteos y montos precisos (y el CHECK de la V6 acepta
    //    REFUNDED).
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/admin/metrics/dashboard - Refleja exactamente pagados, cancelados y reembolsados")
    void shouldReflectFinancialSummaryExactly() throws Exception {
        String adminToken = loginAdminAndReturnToken();
        JsonNode baseline = fetchDashboard(adminToken).get("financialSummary");

        String paidNumber = createGuestOrder("Métrica Pagado", "metrics.pagado@example.com",
                productIdBySku("LUM-FAC-004"), 2);
        String cancelledNumber = createGuestOrder("Métrica Cancelado", "metrics.cancelado@example.com",
                productIdBySku("LUM-COR-002"), 1);
        String refundedNumber = createGuestOrder("Métrica Reembolsado", "metrics.reembolsado@example.com",
                productIdBySku("LUM-FAC-002"), 1);

        BigDecimal paidTotal = patchStatusAndReturnTotal(adminToken, paidNumber, "PAID");
        BigDecimal cancelledTotal = patchStatusAndReturnTotal(adminToken, cancelledNumber, "CANCELLED");
        BigDecimal refundedTotal = patchStatusAndReturnTotal(adminToken, refundedNumber, "REFUNDED");

        JsonNode current = fetchDashboard(adminToken).get("financialSummary");

        assertEquals(asLong(baseline, "completedOrdersCount") + 1L, asLong(current, "completedOrdersCount"),
                "El pedido pagado debe incrementar exactamente en 1 los completados");
        assertEquals(asLong(baseline, "cancelledOrdersCount") + 1L, asLong(current, "cancelledOrdersCount"),
                "El pedido cancelado debe incrementar exactamente en 1 los cancelados");
        assertEquals(asLong(baseline, "refundedOrdersCount") + 1L, asLong(current, "refundedOrdersCount"),
                "El pedido reembolsado debe incrementar exactamente en 1 los reembolsados");

        assertDecimalEquals(
                asDecimal(baseline, "completedOrdersRevenue").add(paidTotal),
                asDecimal(current, "completedOrdersRevenue"),
                "completedOrdersRevenue");
        assertDecimalEquals(
                asDecimal(baseline, "cancelledOrdersLoss").add(cancelledTotal),
                asDecimal(current, "cancelledOrdersLoss"),
                "cancelledOrdersLoss");
        assertDecimalEquals(
                asDecimal(baseline, "refundedOrdersLoss").add(refundedTotal),
                asDecimal(current, "refundedOrdersLoss"),
                "refundedOrdersLoss");

        // netRevenue = ingresos completados; totalLostRevenue = cancelados + reembolsados
        assertDecimalEquals(asDecimal(current, "completedOrdersRevenue"),
                asDecimal(current, "netRevenue"), "netRevenue");
        assertDecimalEquals(
                asDecimal(current, "cancelledOrdersLoss").add(asDecimal(current, "refundedOrdersLoss")),
                asDecimal(current, "totalLostRevenue"),
                "totalLostRevenue");

        // El desglose incluye los estados nuevos con su etiqueta legible
        JsonNode breakdown = fetchDashboard(adminToken).get("ordersByStatus");
        assertEquals("Pagado", findStatus(breakdown, "PAID").get("label").asText());
        assertEquals("Cancelado", findStatus(breakdown, "CANCELLED").get("label").asText());
        assertEquals("Reembolsado", findStatus(breakdown, "REFUNDED").get("label").asText());

        JsonNode lowDemand = fetchDashboard(adminToken).get("lowDemandProducts");
        for (JsonNode product : lowDemand) {
            String level = product.get("demandLevel").asText();
            assertTrue("SIN_VENTAS".equals(level) || "BAJA_ROTACION".equals(level),
                    "demandLevel inesperado: " + level);
            assertTrue(product.get("unitsSold").asLong() <= 5L,
                    "Solo deben listarse productos con pocas ventas");
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private JsonNode fetchDashboard(String adminToken) throws Exception {
        MvcResult result = mockMvc.perform(get(DASHBOARD_URL)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private static long asLong(JsonNode node, String field) {
        assertNotNull(node.get(field), "Falta el campo " + field);
        return node.get(field).asLong();
    }

    private static BigDecimal asDecimal(JsonNode node, String field) {
        assertNotNull(node.get(field), "Falta el campo " + field);
        return node.get(field).decimalValue();
    }

    private static void assertDecimalEquals(BigDecimal expected, BigDecimal actual, String field) {
        assertEquals(0, expected.compareTo(actual),
                "El campo " + field + " debía ser " + expected + " pero fue " + actual);
    }

    private static JsonNode findStatus(JsonNode breakdown, String status) {
        for (JsonNode entry : breakdown) {
            if (status.equals(entry.get("status").asText())) {
                return entry;
            }
        }
        throw new AssertionError("El desglose no contiene el estado " + status);
    }

    /** Registra un cliente de prueba y retorna su token JWT. */
    private String registerAndReturnToken(String fullName, String email) throws Exception {
        Map<String, Object> registerRequest = Map.of(
                "fullName", fullName,
                "email", email,
                "password", CUSTOMER_PASSWORD,
                "phone", "+573000000000"
        );

        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(registerResult.getResponse().getContentAsString())
                .get("token").asText();
    }

    /** Login del administrador sembrado por AdminUserInitializer. */
    private String loginAdminAndReturnToken() throws Exception {
        Map<String, Object> loginRequest = Map.of(
                "email", ADMIN_EMAIL,
                "password", ADMIN_PASSWORD
        );

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token").asText();
    }

    /** Resuelve el ID real del producto del seed por SKU. */
    private Long productIdBySku(String sku) {
        return productRepository.findAll().stream()
                .filter(product -> product.getSku().equals(sku))
                .findFirst()
                .map(product -> product.getId())
                .orElseThrow(() -> new AssertionError("El producto " + sku + " no existe en el seed V2"));
    }

    /** Crea una orden de invitado (user_id NULL) y retorna su número público. */
    private String createGuestOrder(String customerName, String email, Long productId, int quantity)
            throws Exception {
        Map<String, Object> request = Map.ofEntries(
                Map.entry("customerName", customerName),
                Map.entry("customerEmail", email),
                Map.entry("customerPhone", "+573001112233"),
                Map.entry("shippingAddress", "Calle Métricas 123 #45-67"),
                Map.entry("shippingCity", "Bogotá"),
                Map.entry("shippingDepartment", "Cundinamarca"),
                Map.entry("items", List.of(Map.of("productId", productId, "quantity", quantity)))
        );

        MvcResult createResult = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderNumber", matchesPattern("LUM-\\d{8}-[A-Z0-9]{4}")))
                .andReturn();

        return objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("orderNumber").asText();
    }

    /** Cambia el estado vía admin y devuelve el total del pedido ya actualizado. */
    private BigDecimal patchStatusAndReturnTotal(String adminToken, String orderNumber, String newStatus)
            throws Exception {
        MvcResult result = mockMvc.perform(patch("/api/admin/orders/{orderNumber}/status", orderNumber)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", newStatus))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is(newStatus)))
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("totalAmount").decimalValue();
    }
}
