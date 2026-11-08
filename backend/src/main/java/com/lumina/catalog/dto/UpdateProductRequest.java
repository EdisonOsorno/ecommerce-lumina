package com.lumina.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Cuerpo del PUT /api/admin/products/{id} (Fase 5C).
 *
 * El SKU no es editable (es la clave de negocio/auditoría) y el slug no se
 * regenera al renombrar (protege los enlaces públicos ya indexados).
 */
public record UpdateProductRequest(
        @NotBlank(message = "El nombre del producto es obligatorio")
        @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
        String name,

        @NotNull(message = "La categoría es obligatoria")
        Long categoryId,

        String description,

        @Size(max = 500, message = "La URL de imagen no puede exceder 500 caracteres")
        String imageUrl,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
        BigDecimal price,

        @DecimalMin(value = "0.00", message = "El precio de comparación no puede ser negativo")
        BigDecimal compareAtPrice,

        BigDecimal vatRate
) {
}
