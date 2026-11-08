package com.lumina.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Cuerpo del POST /api/admin/inventory/adjust (Fase 5A).
 *
 * quantityDelta es la DIFERENCIA a aplicar: positivo para entradas
 * (reabastecimiento, ej. +10) y negativo para mermas/salidas (ej. -2).
 * El valor 0 se rechaza en el servicio (400 Bad Request).
 */
public record InventoryAdjustRequest(
        @NotNull(message = "El productId es obligatorio")
        Long productId,

        @NotNull(message = "El ajuste de cantidad es obligatorio")
        Integer quantityDelta,

        @NotBlank(message = "El motivo del ajuste es obligatorio")
        String reason
) {
}
