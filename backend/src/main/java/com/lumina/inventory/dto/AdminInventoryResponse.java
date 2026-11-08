package com.lumina.inventory.dto;

import java.math.BigDecimal;

/**
 * Vista de inventario para el backoffice (Fase 5A): agrupa la información
 * del producto y de su fila de inventario en un solo DTO administrativo.
 */
public record AdminInventoryResponse(
        Long productId,
        String productName,
        String sku,
        BigDecimal price,
        int availableQuantity,
        int reservedQuantity,
        int minStockAlert,
        String categoryName
) {
}
