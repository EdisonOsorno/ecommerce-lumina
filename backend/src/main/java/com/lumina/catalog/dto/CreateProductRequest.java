package com.lumina.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Cuerpo del POST /api/admin/products (Fase 5C).
 *
 * El slug NO se envía: el backend lo genera desde el nombre (minúsculas,
 * sin acentos, guiones) garantizando unicidad. vatRate e initialStock son
 * opcionales con valores por defecto definidos en el servicio.
 */
public record CreateProductRequest(
        @NotBlank(message = "El nombre del producto es obligatorio")
        @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
        String name,

        @NotBlank(message = "El SKU es obligatorio")
        @Size(max = 50, message = "El SKU no puede exceder 50 caracteres")
        String sku,

        @NotNull(message = "La categoría es obligatoria")
        Long categoryId,

        String description,

        @Size(max = 500, message = "La URL de imagen no puede exceder 500 caracteres")
        String imageUrl,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
        BigDecimal price,

        /** Precio de referencia (tachado); debe ser mayor o igual al precio de venta. */
        @DecimalMin(value = "0.00", message = "El precio de comparación no puede ser negativo")
        BigDecimal compareAtPrice,

        /** Tarifa IVA del producto (ej. 0.1900); por defecto 0.1900 si viene nulo. */
        BigDecimal vatRate,

        /** Inventario inicial a crear; por defecto 0 si viene nulo. */
        Integer initialStock
) {
}
