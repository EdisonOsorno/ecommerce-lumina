package com.lumina.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina.catalog.repository.CategoryRepository;
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

import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests de integración del CRUD comercial de productos (Fase 5C):
 * creación con slug autogenerado + inventario inicial auditado, SKU único,
 * edición comercial y soft delete (toggle is_active), protegido por ROLE_ADMIN.
 *
 * Cada test usa SKUs disjuntos y crea sus propios productos (nunca muta los
 * del seed V2) para no interferir con las otras suites de la BD compartida.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminProductControllerIntegrationTest {

    private static final String SKU_CREATION = "LUM-ADM-TST-CREACION";
    private static final String SKU_DUPLICADO = "LUM-ADM-TST-DUPLICADO";
    private static final String SKU_EDICION = "LUM-ADM-TST-EDICION";
    private static final String SKU_TOGGLE = "LUM-ADM-TST-TOGGLE";
    private static final String REFERENCE_ID_CREATION = "PRODUCT_CREATION";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    // ------------------------------------------------------------------
    // 1) Crear producto con admin → 201 + slug autogenerado + inventario
    //    inicial (12) + movimiento IN_INITIAL_SEED auditado
    // ------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/admin/products - Admin crea producto con slug, inventario y movimiento de stock")
    void shouldCreateProductWithSlugInventoryAndStockMovement() throws Exception {
        Long categoryId = primeraCategoriaId();

        Map<String, Object> request = Map.of(
                "name", "Sérum Prueba Creación Fase5c",
                "sku", SKU_CREATION,
                "categoryId", categoryId,
                "description", "Producto de prueba automatizada para el CRUD admin",
                "imageUrl", "https://cdn.demo/lumina/serum-prueba.jpg",
                "price", 49900.0,
                "compareAtPrice", 62000.0,
                "initialStock", 12
        );

        MvcResult createResult = mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", "Bearer " + loginAdminAndReturnToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Sérum Prueba Creación Fase5c")))
                .andExpect(jsonPath("$.sku", is(SKU_CREATION)))
                // Slug autogenerado: minúsculas, sin acentos, con guiones
                .andExpect(jsonPath("$.slug", matchesPattern("[a-z0-9]+(-[a-z0-9]+)*")))
                .andExpect(jsonPath("$.categoryId", is(categoryId.intValue())))
                .andExpect(jsonPath("$.categoryName", notNullValue()))
                .andExpect(jsonPath("$.price", is(49900.0)))
                .andExpect(jsonPath("$.compareAtPrice", is(62000.0)))
                // vatRate por defecto 0.1900 cuando no se envía
                .andExpect(jsonPath("$.vatRate", is(0.19)))
                .andExpect(jsonPath("$.active", is(true)))
                .andExpect(jsonPath("$.featured", is(false)))
                .andExpect(jsonPath("$.availableQuantity", is(12)))
                .andExpect(jsonPath("$.createdAt", notNullValue()))
                .andReturn();
        Long createdProductId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asLong();

        // Auditoría: movimiento IN_INITIAL_SEED de PRODUCT_CREATION con saldo 12
        assertTrue(stockMovementRepository.findByReferenceId(REFERENCE_ID_CREATION).stream().anyMatch(movement ->
                        movement.getProduct().getId().equals(createdProductId)
                                && "IN_INITIAL_SEED".equals(movement.getMovementType())
                                && movement.getQuantity() == 12
                                && movement.getBalanceAfter() == 12
                                && "Inventario inicial al crear producto".equals(movement.getReason())),
                "Debe existir un movimiento IN_INITIAL_SEED de PRODUCT_CREATION con cantidad y saldo 12");
    }

    // ------------------------------------------------------------------
    // 2) SKU duplicado → 409 Conflict
    // ------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/admin/products - Rechaza con 409 si el SKU ya existe")
    void shouldRejectDuplicateSku() throws Exception {
        Long categoryId = primeraCategoriaId();

        Map<String, Object> request = Map.of(
                "name", "Producto Duplicado Fase5c",
                "sku", SKU_DUPLICADO,
                "categoryId", categoryId,
                "price", 15000.0
        );

        // Primera creación OK
        mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", "Bearer " + loginAdminAndReturnToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Segunda creación con el MISMO SKU → 409
        mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", "Bearer " + loginAdminAndReturnToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

        // El mismo SKU en otra capitalización también colisiona (unicidad insensible)
        mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", "Bearer " + loginAdminAndReturnToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Producto Duplicado Variante",
                                "sku", SKU_DUPLICADO.toLowerCase(),
                                "categoryId", categoryId,
                                "price", 15000.0))))
                .andExpect(status().isConflict());
    }

    // ------------------------------------------------------------------
    // 3) Editar producto existente → 200 OK con datos actualizados
    // ------------------------------------------------------------------
    @Test
    @DisplayName("PUT /api/admin/products/{id} - Actualiza datos comerciales del producto")
    void shouldUpdateProductFields() throws Exception {
        Long categoryId = primeraCategoriaId();

        MvcResult createResult = mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", "Bearer " + loginAdminAndReturnToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Crema Edición Antes Fase5c",
                                "sku", SKU_EDICION,
                                "categoryId", categoryId,
                                "price", 30000.0,
                                "initialStock", 8))))
                .andExpect(status().isCreated())
                .andReturn();
        Long productId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asLong();

        Map<String, Object> updateRequest = Map.of(
                "name", "Crema Edición Después Fase5c",
                "categoryId", categoryId,
                "description", "Descripción corregida en la edición",
                "imageUrl", "https://cdn.demo/lumina/crema-editada.jpg",
                "price", 35900.0,
                "compareAtPrice", 40000.0,
                "vatRate", 0.05
        );

        mockMvc.perform(put("/api/admin/products/{id}", productId)
                        .header("Authorization", "Bearer " + loginAdminAndReturnToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(productId.intValue())))
                .andExpect(jsonPath("$.name", is("Crema Edición Después Fase5c")))
                // El SKU y el slug NO cambiaron en la edición
                .andExpect(jsonPath("$.sku", is(SKU_EDICION)))
                // El DTO AdminProductResponse no expone description (spec exacta del DTO)
                .andExpect(jsonPath("$.imageUrl", is("https://cdn.demo/lumina/crema-editada.jpg")))
                .andExpect(jsonPath("$.price", is(35900.0)))
                .andExpect(jsonPath("$.compareAtPrice", is(40000.0)))
                .andExpect(jsonPath("$.vatRate", is(0.05)))
                .andExpect(jsonPath("$.active", is(true)))
                // El inventario creado al crear se conserva intacto
                .andExpect(jsonPath("$.availableQuantity", is(8)));
    }

    // ------------------------------------------------------------------
    // 4) Toggle status → 200 OK y active pasa a false (soft delete)
    // ------------------------------------------------------------------
    @Test
    @DisplayName("PATCH /api/admin/products/{id}/toggle-status - Desactiva el producto sin borrarlo")
    void shouldToggleProductStatusToInactive() throws Exception {
        Long categoryId = primeraCategoriaId();

        MvcResult createResult = mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", "Bearer " + loginAdminAndReturnToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Mascarilla Toggle Fase5c",
                                "sku", SKU_TOGGLE,
                                "categoryId", categoryId,
                                "price", 22000.0,
                                "initialStock", 3))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.active", is(true)))
                .andReturn();
        Long productId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(patch("/api/admin/products/{id}/toggle-status", productId)
                        .header("Authorization", "Bearer " + loginAdminAndReturnToken()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(productId.intValue())))
                .andExpect(jsonPath("$.sku", is(SKU_TOGGLE)))
                .andExpect(jsonPath("$.active", is(false)))
                .andExpect(jsonPath("$.availableQuantity", is(3)));

        // Soft delete: el producto sigue existiendo en el listado admin (inactivo)
        MvcResult listResult = mockMvc.perform(get("/api/admin/products")
                        .header("Authorization", "Bearer " + loginAdminAndReturnToken()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();
        String listJson = listResult.getResponse().getContentAsString();
        assertTrue(listJson.contains(SKU_TOGGLE),
                "El producto desactivado debe seguir apareciendo en el listado admin");
    }

    // ------------------------------------------------------------------
    // 5) Seguridad: sin token → 403; con ROLE_CUSTOMER → 403
    // ------------------------------------------------------------------
    @Test
    @DisplayName("Rutas /api/admin/products - Sin token y con ROLE_CUSTOMER responden 403")
    void shouldRejectAdminProductRoutesWithoutAdminRole() throws Exception {
        // Sin token
        mockMvc.perform(get("/api/admin/products"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        // Con token de cliente común (ROLE_CUSTOMER)
        String customerToken = registerAndReturnToken(
                "Cliente Productos", "productos.customer@example.com");
        mockMvc.perform(get("/api/admin/products")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /** Resuelve el ID de la primera categoría del seed (valida que exista). */
    private Long primeraCategoriaId() {
        var categorias = categoryRepository.findAll();
        assertTrue(!categorias.isEmpty(), "El seed V2 debe tener categorías");
        return categorias.get(0).getId();
    }

    /** Login del administrador sembrado por AdminUserInitializer. */
    private String loginAdminAndReturnToken() throws Exception {
        Map<String, Object> loginRequest = Map.of(
                "email", "admin@lumina.demo",
                "password", "AdminLumina2026!"
        );

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token").asText();
    }

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

        return objectMapper.readTree(registerResult.getResponse().getContentAsString())
                .get("token").asText();
    }
}
