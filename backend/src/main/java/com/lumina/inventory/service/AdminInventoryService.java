package com.lumina.inventory.service;

import com.lumina.catalog.domain.Product;
import com.lumina.catalog.repository.ProductRepository;
import com.lumina.inventory.domain.InventoryItem;
import com.lumina.inventory.domain.StockMovement;
import com.lumina.inventory.dto.AdminInventoryResponse;
import com.lumina.inventory.dto.InventoryAdjustRequest;
import com.lumina.inventory.repository.InventoryItemRepository;
import com.lumina.inventory.repository.StockMovementRepository;
import com.lumina.shared.errors.InsufficientStockException;
import com.lumina.shared.errors.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Operaciones de inventario exclusivas del backoffice (Fase 5A).
 *
 * El ajuste de stock es transaccional y usa BLOQUEO PESIMISTA sobre la fila
 * de inventario, igual que la reserva por compra: serializa ajustes y ventas
 * concurrentes sobre el mismo producto para no perder ni ensuciar balances.
 * Cada ajuste queda auditado en stock_movements (IN_ADJUSTMENT / OUT_ADJUSTMENT).
 */
@Service
public class AdminInventoryService {

    private static final String REFERENCE_ID_ADMIN = "ADMIN_MANUAL";

    private final InventoryItemRepository inventoryItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;

    public AdminInventoryService(InventoryItemRepository inventoryItemRepository,
                                 StockMovementRepository stockMovementRepository,
                                 ProductRepository productRepository) {
        this.inventoryItemRepository = inventoryItemRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.productRepository = productRepository;
    }

    /**
     * Listado completo de productos con su inventario y categoría (vista admin).
     * Es readOnly: se acceden las asociaciones lazy dentro de la misma transacción.
     */
    @Transactional(readOnly = true)
    public List<AdminInventoryResponse> listInventoryForAdmin() {
        return inventoryItemRepository.findAll().stream()
                .map(this::toAdminResponse)
                .toList();
    }

    /**
     * Ajuste manual de inventario desde el backoffice.
     *
     * @param request delta distinto de cero: positivo = entrada, negativo = salida
     * @return el inventario ya actualizado
     * @throws IllegalArgumentException   si el delta es 0 (→ 400 vía asesor global)
     * @throws ResourceNotFoundException  si el producto no existe (→ 404)
     * @throws InsufficientStockException si el ajuste dejara el stock bajo cero (→ 409)
     */
    @Transactional
    public AdminInventoryResponse adjustInventory(InventoryAdjustRequest request) {
        int quantityDelta = request.quantityDelta();
        if (quantityDelta == 0) {
            throw new IllegalArgumentException(
                    "El ajuste de inventario debe ser distinto de cero (positivo = entrada, negativo = salida)");
        }

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "El producto " + request.productId() + " no existe"));

        // BLOQUEO PESIMISTA: misma técnica anti-overselling de la reserva por compra
        InventoryItem item = inventoryItemRepository.findByProductIdWithLock(product.getId())
                .orElseThrow(() -> new InsufficientStockException(
                        "El producto '" + product.getName() + "' no tiene inventario registrado"));

        int newQuantity = item.getAvailableQuantity() + quantityDelta;
        if (newQuantity < 0) {
            throw new InsufficientStockException(
                    "No es posible reducir el stock de '" + product.getName() + "' en "
                            + Math.abs(quantityDelta) + ": disponible " + item.getAvailableQuantity());
        }

        item.setAvailableQuantity(newQuantity);

        // Auditoría del ajuste manual (referenceId fijo "ADMIN_MANUAL")
        StockMovement movement = new StockMovement();
        movement.setProduct(product);
        movement.setMovementType(quantityDelta > 0 ? "IN_ADJUSTMENT" : "OUT_ADJUSTMENT");
        movement.setQuantity(quantityDelta); // Convención de auditoría: negativo para salidas
        movement.setBalanceAfter(newQuantity);
        movement.setReason(request.reason().trim());
        movement.setReferenceId(REFERENCE_ID_ADMIN);
        stockMovementRepository.save(movement);

        return toAdminResponse(item);
    }

    /** Mapea la fila de inventario + producto + categoría al DTO del backoffice. */
    private AdminInventoryResponse toAdminResponse(InventoryItem item) {
        Product product = item.getProduct();
        return new AdminInventoryResponse(
                product.getId(),
                product.getName(),
                product.getSku(),
                product.getPrice(),
                item.getAvailableQuantity(),
                item.getReservedQuantity(),
                item.getMinStockAlert(),
                product.getCategory().getName()
        );
    }
}
