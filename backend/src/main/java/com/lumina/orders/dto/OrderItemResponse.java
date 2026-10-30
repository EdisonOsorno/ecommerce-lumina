package com.lumina.orders.dto;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long productId,
        String productName,
        String productSku,
        /** Precio unitario con IVA incluido (COP). */
        BigDecimal unitPrice,
        Integer quantity,
        /** Total de la línea con IVA incluido (COP). */
        BigDecimal lineTotal
) {
}
