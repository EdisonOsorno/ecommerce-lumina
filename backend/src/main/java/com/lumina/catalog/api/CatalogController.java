package com.lumina.catalog.api;

import com.lumina.catalog.dto.CategoryResponse;
import com.lumina.catalog.dto.ProductDetailResponse;
import com.lumina.catalog.dto.ProductSummaryResponse;
import com.lumina.catalog.service.CatalogService;
import com.lumina.shared.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog")
@Tag(name = "Catálogo Público", description = "Consultas públicas de productos, categorías y existencias")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/categories")
    @Operation(summary = "Listar todas las categorías activas")
    public ResponseEntity<List<CategoryResponse>> getCategories() {
        return ResponseEntity.ok(catalogService.getActiveCategories());
    }

    @GetMapping("/products")
    @Operation(summary = "Consultar catálogo de productos con paginación, filtros por categoría y búsqueda")
    public ResponseEntity<PageResponse<ProductSummaryResponse>> getProducts(
            @Parameter(description = "Slug de categoría (opcional)")
            @RequestParam(required = false) String category,

            @Parameter(description = "Término de búsqueda en nombre o descripción (opcional)")
            @RequestParam(required = false) String search,

            @Parameter(description = "Número de página (0-indexada)")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Elementos por página")
            @RequestParam(defaultValue = "12") int size,

            @Parameter(description = "Criterio de orden: 'price,asc', 'price,desc', 'name,asc', 'id,desc'")
            @RequestParam(defaultValue = "id,desc") String sort
    ) {
        // Límite de seguridad de tamaño de página para evitar abusos DoS
        int safeSize = Math.min(Math.max(size, 1), 50);

        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction = (sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        // Validar campos de orden permitidos para prevenir SQL injections o errores
        if (!List.of("id", "price", "name", "createdAt").contains(sortField)) {
            sortField = "id";
        }

        Pageable pageable = PageRequest.of(page, safeSize, Sort.by(direction, sortField));
        return ResponseEntity.ok(catalogService.getCatalog(category, search, pageable));
    }

    @GetMapping("/featured")
    @Operation(summary = "Listar productos destacados para la página principal")
    public ResponseEntity<List<ProductSummaryResponse>> getFeaturedProducts() {
        return ResponseEntity.ok(catalogService.getFeaturedProducts());
    }

    @GetMapping("/products/{slug}")
    @Operation(summary = "Obtener detalle completo de un producto por su slug")
    public ResponseEntity<ProductDetailResponse> getProductBySlug(
            @Parameter(description = "Slug único del producto")
            @PathVariable String slug
    ) {
        return ResponseEntity.ok(catalogService.getProductBySlug(slug));
    }
}
