package com.lumina.admin.catalog;

import com.lumina.catalog.dto.AdminProductResponse;
import com.lumina.catalog.dto.CreateProductRequest;
import com.lumina.catalog.dto.UpdateProductRequest;
import com.lumina.catalog.service.AdminCatalogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * CRUD comercial de productos para el backoffice (Fase 5C), bajo
 * /api/admin/** → hasRole("ADMIN") en SecurityConfig.
 *
 * Los productos NUNCA se eliminan físicamente: la salida del portafolio
 * (INVIMA / descontinuación) es toggle del campo is_active, para conservar
 * la integridad histórica de las órdenes ya compradas.
 */
@RestController
@RequestMapping(path = "/api/admin/products", produces = MediaType.APPLICATION_JSON_VALUE)
public class AdminProductController {

    private final AdminCatalogService adminCatalogService;

    public AdminProductController(AdminCatalogService adminCatalogService) {
        this.adminCatalogService = adminCatalogService;
    }

    /** Listado completo de productos (activos e inactivos), más nuevos primero. */
    @GetMapping
    public List<AdminProductResponse> listProducts() {
        return adminCatalogService.listAllProductsForAdmin();
    }

    /** Crea un producto con slug autogenerado, inventario inicial y auditoría de stock. */
    @PostMapping
    public ResponseEntity<AdminProductResponse> createProduct(
            @Valid @RequestBody CreateProductRequest request) {
        AdminProductResponse created = adminCatalogService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /** Edita los datos comerciales del producto (SKU y slug no cambian). */
    @PutMapping("/{id}")
    public AdminProductResponse updateProduct(@PathVariable Long id,
                                              @Valid @RequestBody UpdateProductRequest request) {
        return adminCatalogService.updateProduct(id, request);
    }

    /** Desactiva/reactiva el producto (soft delete, sin borrado físico). */
    @PatchMapping("/{id}/toggle-status")
    public AdminProductResponse toggleStatus(@PathVariable Long id) {
        return adminCatalogService.toggleProductStatus(id);
    }
}
