package com.lumina.orders.dto;

import com.lumina.orders.domain.OrderStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Cuerpo del PATCH /api/admin/orders/{orderNumber}/status (Fase 5A).
 * Jackson mapea el string JSON al enum; un valor inválido responde 400
 * vía el handler de HttpMessageNotReadableException del asesor global.
 */
public record UpdateOrderStatusRequest(
        @NotNull(message = "El estado del pedido es obligatorio")
        OrderStatus status
) {
}
