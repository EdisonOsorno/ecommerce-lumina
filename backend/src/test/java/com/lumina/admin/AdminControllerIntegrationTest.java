package com.lumina.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina.catalog.repository.ProductRepository;
import com.lumina.inventory.domain.StockMovement;
import com.lumina.inventory.repository.StockMovementRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests de integración del backoffice (Fase 5A): semillero del administrador,
 * regla /api/admin/** → ROLE_ADMIN, gestión de estados de pedidos y ajustes
 * de inventario auditados.
 *
 * Comparte la BD H2 del contexto de tests (los cambios commitean): los SKUs
 * usados aquí (LUM-MAQ-002, LUM-COR-001) no mutan inventario en otras suites.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminControllerIntegrationTest {

    private static final String ADMIN_EMAIL = "admin@lumina.demo";
    private static final String ADMIN_PASSWORD = "AdminLumina2026!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    // ------------------------------------------------------------------
    // 1) /api/admin/orders SIN token → 403 Forbidden
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/admin/orders - Sin token responde 403 (ruta protegida)")
    void shouldRejectAdminOrdersWithoutToken() throws Exception {
        mockMvc.perform(get("/api/admin/orders"))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------
    // 2) /api/admin/orders con token de ROLE_CUSTOMER → 403 Forbidden
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/admin/orders - Cliente común (ROLE_CUSTOMER) recibe 403")
    void shouldRejectAdminOrdersForCustomerToken() throws Exception {
        String customerToken = registerAndReturnToken(
                "Cliente Curioso", "admin.curioso@example.com");

        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------
    // 3) Login admin@lumina.demo / AdminLumina2026! → 200 + ROLE_ADMIN
    //    (el usuario fue sembrado por AdminUserInitializer al arrancar)
    // ------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/auth/login - El administrador sembrado ingresa con rol ROLE_ADMIN")
    void shouldLoginSeededAdminWithAdminRole() throws Exception {
        Map<String, Object> loginRequest = Map.of(
                "email", ADMIN_EMAIL,
                "password", ADMIN_PASSWORD
        );

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.role", is("ROLE_ADMIN")))
                .andExpect(jsonPath("$.email", is(ADMIN_EMAIL)));
    }

    // ------------------------------------------------------------------
    // 4) /api/admin/orders con token de administrador → 200 + resúmenes
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/admin/orders - Admin obtiene el listado completo con resumen")
    void shouldListAllOrdersForAdmin() throws Exception {
        String adminToken = loginAdminAndReturnToken();

        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(0)));
    }

    // ------------------------------------------------------------------
    // 5) PATCH /api/admin/orders/{orderNumber}/status → SHIPPED + 200
    //    (válido gracias a la migración V4 del CHECK de orders.status)
    // ------------------------------------------------------------------
    @Test
    @DisplayName("PATCH /api/admin/orders/{number}/status - Admin transiciona el pedido a SHIPPED")
    void shouldUpdateOrderStatusToShipped() throws Exception {
        Long productId = productIdBySku("LUM-MAQ-002"); // No mutado por otras suites
        String orderNumber = createGuestOrder("Pedido Admin", "admin.pedido@example.com", productId, 1);

        String adminToken = loginAdminAndReturnToken();
        mockMvc.perform(patch("/api/admin/orders/{orderNumber}/status", orderNumber)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "SHIPPED"))))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.orderNumber", is(orderNumber)))
                .andExpect(jsonPath("$.status", is("SHIPPED")));

        // El detalle vía admin refleja el nuevo estado
        mockMvc.perform(get("/api/admin/orders/{orderNumber}", orderNumber)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SHIPPED")));
    }

    // ------------------------------------------------------------------
    // 6) POST /api/admin/inventory/adjust +10 sobre LUM-COR-001 (seed 28
    //    → 38) y movimiento IN_ADJUSTMENT con referenceId "ADMIN_MANUAL"
    // ------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/admin/inventory/adjust - +10 unidades incrementa el stock y audita el movimiento")
    void shouldAdjustInventoryAndRecordAdminMovement() throws Exception {
        Long productId = productIdBySku("LUM-COR-001"); // Stock del seed: 28

        Map<String, Object> adjustRequest = Map.of(
                "productId", productId,
                "quantityDelta", 10,
                "reason", "Reabastecimiento de bodega"
        );

        String adminToken = loginAdminAndReturnToken();
        mockMvc.perform(post("/api/admin/inventory/adjust")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adjustRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.productId", is(productId.intValue())))
                .andExpect(jsonPath("$.sku", is("LUM-COR-001")))
                .andExpect(jsonPath("$.availableQuantity", is(38))) // 28 + 10
                .andExpect(jsonPath("$.categoryName", notNullValue()));

        // Auditoría: este test es el único que ajusta en toda la suite
        assertTrue(stockMovementRepository.findByReferenceId("ADMIN_MANUAL").stream().anyMatch(movement ->
                        movement.getProduct().getId().equals(productId)
                                && "IN_ADJUSTMENT".equals(movement.getMovementType())
                                && movement.getQuantity() == 10
                                && movement.getBalanceAfter() == 38
                                && "Reabastecimiento de bodega".equals(movement.getReason())),
                "Debe existir un movimiento IN_ADJUSTMENT de ADMIN_MANUAL con +10 y saldo 38");
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /** Registra un cliente de prueba y retorna su token JWT. */
    private String registerAndReturnToken(String fullName, String email) throws Exception {
        Map<String, Object> registerRequest = Map.of(
                "fullName", fullName,
                "email", email,
                "password", "ContrasenaFuerte2026",
                "phone", "+573000000000"
        );

        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode body = objectMapper.readTree(registerResult.getResponse().getContentAsString());
        return body.get("token").asText();
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

        JsonNode body = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return body.get("token").asText();
    }

    /** Resuelve el ID real del producto del seed por SKU. */
    private Long productIdBySku(String sku) {
        return productRepository.findAll().stream()
                .filter(p -> p.getSku().equals(sku))
                .findFirst()
                .map(p -> p.getId())
                .orElseThrow(() -> new AssertionError("El producto " + sku + " no existe en el seed V2"));
    }

    /** Crea una orden de invitado (user_id NULL) y retorna su número público. */
    private String createGuestOrder(String customerName, String email, Long productId, int quantity)
            throws Exception {
        Map<String, Object> request = Map.ofEntries(
                Map.entry("customerName", customerName),
                Map.entry("customerEmail", email),
                Map.entry("customerPhone", "+573001112233"),
                Map.entry("shippingAddress", "Calle Fake 123 #45-67"),
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
}
