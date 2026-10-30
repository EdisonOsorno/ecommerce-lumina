package com.lumina.orders.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Solicitud de creación de orden (compra como invitado o usuario autenticado).
 * El cliente NUNCA envía precios: el backend los recalcula con BigDecimal
 * leyendo la tabla products (regla de oro del módulo de pedidos).
 */
public record CreateOrderRequest(
        @NotBlank(message = "El nombre del cliente es obligatorio")
        String customerName,

        @NotBlank(message = "El email del cliente es obligatorio")
        @Email(message = "El email no tiene un formato válido")
        String customerEmail,

        String customerPhone,

        @NotBlank(message = "La dirección de envío es obligatoria")
        String shippingAddress,

        @NotBlank(message = "La ciudad de envío es obligatoria")
        String shippingCity,

        @NotBlank(message = "El departamento de envío es obligatorio")
        String shippingDepartment,

        @NotEmpty(message = "El pedido debe incluir al menos un producto")
        List<CreateOrderItemRequest> items
) {
}
