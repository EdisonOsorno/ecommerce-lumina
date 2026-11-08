package com.lumina.catalog;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatalogControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/catalog/categories - Debe retornar las categorías activas con HTTP 200")
    void shouldReturnActiveCategories() throws Exception {
        mockMvc.perform(get("/api/catalog/categories"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(4))))
                .andExpect(jsonPath("$[0].slug", notNullValue()))
                .andExpect(jsonPath("$[0].name", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/catalog/products - Debe retornar catálogo paginado con HTTP 200")
    void shouldReturnPaginatedProducts() throws Exception {
        mockMvc.perform(get("/api/catalog/products")
                        .param("page", "0")
                        .param("size", "6"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.pageNumber", is(0)))
                .andExpect(jsonPath("$.pageSize", is(6)))
                .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(10)))
                .andExpect(jsonPath("$.content[0].price", notNullValue()));
                // Nota (Fase 5C): el sort es id,desc → content[0] siempre es el producto
                // más nuevo, que puede ser creado por el backoffice con stock arbitrario.
                // La aserción inStock en índice fijo es inestable por diseño y se retiró;
                // el comportamiento de stock sigue cubierto en shouldReturnProductDetail.
    }

    @Test
    @DisplayName("GET /api/catalog/products?category=cuidado-facial - Debe filtrar correctamente")
    void shouldFilterProductsByCategory() throws Exception {
        mockMvc.perform(get("/api/catalog/products")
                        .param("category", "cuidado-facial"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].categorySlug", everyItem(is("cuidado-facial"))));
    }

    @Test
    @DisplayName("GET /api/catalog/products/{slug} - Debe retornar detalle de producto existente")
    void shouldReturnProductDetail() throws Exception {
        mockMvc.perform(get("/api/catalog/products/serum-facial-acido-hialuronico"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug", is("serum-facial-acido-hialuronico")))
                .andExpect(jsonPath("$.sku", is("LUM-FAC-001")))
                .andExpect(jsonPath("$.price", is(68000.0)))
                .andExpect(jsonPath("$.netBasePrice", notNullValue()))
                .andExpect(jsonPath("$.vatAmount", notNullValue()))
                .andExpect(jsonPath("$.availableStock", is(25)))
                .andExpect(jsonPath("$.inStock", is(true)));
    }

    @Test
    @DisplayName("GET /api/catalog/products/{slug} - Debe retornar HTTP 404 para producto inexistente")
    void shouldReturn404ForNonExistentProduct() throws Exception {
        mockMvc.perform(get("/api/catalog/products/producto-que-no-existe"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title", is("Recurso no encontrado")))
                .andExpect(jsonPath("$.status", is(404)));
    }
}
