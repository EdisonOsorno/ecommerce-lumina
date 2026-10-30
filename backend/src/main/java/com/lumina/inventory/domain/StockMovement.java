package com.lumina.inventory.domain;

import com.lumina.catalog.domain.Product;
import jakarta.persistence.*;
import java.time.Instant;

/**
 * Movimiento de stock (auditoría). La tabla existe desde V1; la entidad
 * se agrega en Fase 3C para registrar la reserva de inventario por pedidos.
 */
@Entity
@Table(name = "stock_movements")
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** Tipo de movimiento (IN_INITIAL_SEED, OUT_RESERVE_ORDER, ...). */
    @Column(name = "movement_type", nullable = false, length = 30)
    private String movementType;

    /** Cantidad afectada; negativa para salidas (CHECK quantity != 0). */
    @Column(nullable = false)
    private int quantity;

    /** Saldo disponible después del movimiento (CHECK balance_after >= 0). */
    @Column(name = "balance_after", nullable = false)
    private int balanceAfter;

    @Column(nullable = false, length = 255)
    private String reason;

    /** Referencia libre (ej. número de orden que originó la reserva). */
    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public StockMovement() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public String getMovementType() { return movementType; }
    public void setMovementType(String movementType) { this.movementType = movementType; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public int getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(int balanceAfter) { this.balanceAfter = balanceAfter; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }
    public Instant getCreatedAt() { return createdAt; }
}
