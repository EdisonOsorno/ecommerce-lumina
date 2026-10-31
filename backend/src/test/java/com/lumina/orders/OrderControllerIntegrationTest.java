package com.lumina.orders;

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

import java.util.Iterator;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests de integración del módulo de pedidos (Fase 3C).
 *
 * Cada test usa un producto distinto del seed de V2 (SKUs disjuntos) para que
 * la reserva de inventario de un pedido no interfiera con los demás, incluso
 * compartiendo la misma BD H2 del contexto de tests (los cambios SÍ commitean).
 *
 * Precios del seed: LUM-MAQ-001 $18.000 (stock 60), LUM-FAC-001 $68.000 (stock 25),
 * LUM-MAQ-002 $32.000 (stock 15), LUM-FAC-003 $72.000 (stock 40).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OrderControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;

    // ------------------------------------------------------------------
    // a) Invitado, subtotal < $100.000 → envío $12.000 COP y 201 Created
    // ------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/orders - Invitado con total < $100.000 aplica envío de $12.000 COP")
    void shouldApplyShippingCostForLowGuestOrder() throws Exception {
        Long productId = productIdBySku("LUM-MAQ-001");

        Map<String, Object> request = withItems(
                orderRequest("Valentina Ruiz", EMAIL_A), productId, 2);

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.orderNumber", matchesPattern("LUM-\\d{8}-[A-Z0-9]{4}")))
                .andExpect(jsonPath("$.shippingCost", is(12000.0)))
                .andExpect(jsonPath("$.totalAmount", is(48000.0))) // 18.000 × 2 + 12.000
                .andExpect(jsonPath("$.status", is("PENDING_PAYMENT")))
                .andExpect(jsonPath("$.customerName", is("Valentina Ruiz")));
    }

    // ------------------------------------------------------------------
    // b) Subtotal ≥ $100.000 → envío gratis ($0.00) y 201 Created
    // ------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/orders - Pedido con total ≥ $100.000 obtiene envío gratis")
    void shouldApplyFreeShippingAboveThreshold() throws Exception {
        Long productId = productIdBySku("LUM-FAC-001");

        Map<String, Object> request = withItems(
                orderRequest("Camila Torres", EMAIL_B), productId, 2);

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shippingCost", is(0.0))) // 68.000 × 2 = 136.000 ≥ 100.000 → gratis
                .andExpect(jsonPath("$.totalAmount", is(136000.0)));
    }

    // ------------------------------------------------------------------
    // c) Cantidad mayor al stock → 409 Conflict (InsufficientStockException)
    // ------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/orders - Rechaza con 409 si la cantidad supera el stock disponible")
    void shouldRejectWhenQuantityExceedsAvailableStock() throws Exception {
        Long productId = productIdBySku("LUM-MAQ-002"); // Stock del seed: 15

        Map<String, Object> request = withItems(
                orderRequest("Ada Pérez", EMAIL_C), productId, 16);

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title", is("Stock insuficiente")))
                .andExpect(jsonPath("$.detail", notNullValue()));
    }

    // ------------------------------------------------------------------
    // d) Consulta por orderNumber → 200 OK con items y shippingCost
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/orders/{orderNumber} - Retorna la orden con items y costo de envío")
    void shouldRetrieveOrderDetailsByOrderNumber() throws Exception {
        Long productId = productIdBySku("LUM-FAC-003");

        Map<String, Object> request = withItems(
                orderRequest("Sofía Restrepo", EMAIL_D), productId, 1);

        MvcResult createResult = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode created = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String orderNumber = created.get("orderNumber").asText();
        assertTrue(orderNumber.startsWith("LUM-"), "El número de pedido debe iniciar con LUM-");

        mockMvc.perform(get("/api/orders/{orderNumber}", orderNumber))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber", is(orderNumber)))
                .andExpect(jsonPath("$.customerName", is("Sofía Restrepo")))
                .andExpect(jsonPath("$.customerEmail", is("sofia.pedido@example.com")))
                .andExpect(jsonPath("$.shippingAddress", is("Calle Fake 123 #45-67")))
                .andExpect(jsonPath("$.shippingCity", is("Bogotá")))
                .andExpect(jsonPath("$.shippingCost", is(12000.0)))
                .andExpect(jsonPath("$.totalAmount", is(84000.0))) // 72.000 × 1 + 12.000
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].productName", is("Protector Solar Fluido Invisible FPS 50+")))
                .andExpect(jsonPath("$.items[0].productSku", is("LUM-FAC-003")))
                .andExpect(jsonPath("$.items[0].unitPrice", is(72000.0)))
                .andExpect(jsonPath("$.items[0].quantity", is(1)))
                .andExpect(jsonPath("$.items[0].lineTotal", is(72000.0)));
    }

    // ------------------------------------------------------------------
    // e) Historial "Mi Cuenta": sin token se rechaza (403 entry point)
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/orders/my-orders - Sin token responde 403 (ruta protegida)")
    void shouldRejectMyOrdersWithoutToken() throws Exception {
        mockMvc.perform(get("/api/orders/my-orders"))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------
    // f) Historial "Mi Cuenta": con token retorna las órdenes del usuario
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/orders/my-orders - Con token retorna el historial del usuario con resumen")
    void shouldReturnMyOrdersForAuthenticatedUser() throws Exception {
        String token = registerAndReturnToken("Historial Uno", "historial.uno@example.com");
        Long productId = productIdBySku("LUM-CAP-001");

        MvcResult createResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(withItems(orderRequest("Historial Uno", "historial.uno@example.com"), productId, 1))))
                .andExpect(status().isCreated())
                .andReturn();
        String orderNumber = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("orderNumber").asText();

        MvcResult historyResult = mockMvc.perform(get("/api/orders/my-orders")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", notNullValue()))
                .andReturn();

        JsonNode history = objectMapper.readTree(historyResult.getResponse().getContentAsString());
        boolean found = false;
        for (Iterator<JsonNode> it = history.iterator(); it.hasNext(); ) {
            JsonNode summary = it.next();
            if (orderNumber.equals(summary.get("orderNumber").asText())
                    && summary.has("createdAt")
                    && summary.get("itemsCount").asInt() >= 1
                    && summary.has("totalAmount")
                    && summary.has("status")) {
                found = true;
                break;
            }
        }
        assertTrue(found, "La orden creada debe aparecer en el historial del usuario");
    }

    // ------------------------------------------------------------------
    // g) Blindaje IDOR: el dueño ve su orden (200); otro usuario autenticado
    //    que intente verla recibe 403 Forbidden
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/orders/{orderNumber} - IDOR: dueño OK (200), otro usuario autenticado 403")
    void shouldEnforceOwnerOnlyAccessOnUserOrders() throws Exception {
        String ownerToken = registerAndReturnToken("Owner Público", "idor.owner@example.com");
        String attackerToken = registerAndReturnToken("Atacante Api", "idor.attacker@example.com");
        Long productId = productIdBySku("LUM-CAP-002");

        MvcResult createResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(withItems(orderRequest("Owner Público", "idor.owner@example.com"), productId, 1))))
                .andExpect(status().isCreated())
                .andReturn();
        String orderNumber = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("orderNumber").asText();

        // El dueño SÍ puede ver su propia orden
        mockMvc.perform(get("/api/orders/{orderNumber}", orderNumber)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber", is(orderNumber)));

        // Otro usuario autenticado NO puede ver la orden del dueño → 403
        mockMvc.perform(get("/api/orders/{orderNumber}", orderNumber)
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isForbidden())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title", is("Acceso denegado")))
                .andExpect(jsonPath("$.detail", is("No tienes permiso para consultar este pedido")));

        // La misma orden sigue siendo visible sin sesión solo si fuera de invitado;
        // aquí es de usuario: sin token también debe ser 403
        mockMvc.perform(get("/api/orders/{orderNumber}", orderNumber))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail", is("Debes iniciar sesión para ver este pedido")));
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /** Registra un usuario de prueba y retorna su token JWT. */
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

    /** Resuelve el ID real del producto del seed por SKU (busca en el catálogo cargado). */
    private Long productIdBySku(String sku) {
        return productRepository.findAll().stream()
                .filter(p -> p.getSku().equals(sku))
                .findFirst()
                .map(p -> p.getId())
                .orElseThrow(() -> new AssertionError("El producto " + sku + " no existe en el seed V2"));
    }

    private Map<String, Object> withItems(Map<String, Object> base, Long productId, int quantity) {
        Map<String, Object> item = Map.of("productId", productId, "quantity", quantity);
        return Map.ofEntries(
                Map.entry("customerName", base.get("customerName")),
                Map.entry("customerEmail", base.get("customerEmail")),
                Map.entry("customerPhone", base.get("customerPhone")),
                Map.entry("shippingAddress", base.get("shippingAddress")),
                Map.entry("shippingCity", base.get("shippingCity")),
                Map.entry("shippingDepartment", base.get("shippingDepartment")),
                Map.entry("items", List.of(item))
        );
    }

    /** Email sintetizado por test (ASCII, sin tildes) para aserción determinista. */
    private static final String EMAIL_A = "valentina.pedido@example.com";
    private static final String EMAIL_B = "camila.pedido@example.com";
    private static final String EMAIL_C = "ada.pedido@example.com";
    private static final String EMAIL_D = "sofia.pedido@example.com";

    /** Estructura base de la solicitud de pedido (los items se agregan con withItems). */
    private Map<String, Object> orderRequest(String customerName, String email) {
        return Map.of(
                "customerName", customerName,
                "customerEmail", email,
                "customerPhone", "+573001112233",
                "shippingAddress", "Calle Fake 123 #45-67",
                "shippingCity", "Bogotá",
                "shippingDepartment", "Cundinamarca"
        );
    }
}
