package com.lumina.inventory.domain;

import com.lumina.catalog.domain.Product;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "inventory_items")
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(name = "available_quantity", nullable = false)
    private int availableQuantity = 0;

    @Column(name = "reserved_quantity", nullable = false)
    private int reservedQuantity = 0;

    @Column(name = "min_stock_alert", nullable = false)
    private int minStockAlert = 5;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public InventoryItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public int getAvailableQuantity() { return availableQuantity; }
    public void setAvailableQuantity(int availableQuantity) { this.availableQuantity = availableQuantity; }
    public int getReservedQuantity() { return reservedQuantity; }
    public void setReservedQuantity(int reservedQuantity) { this.reservedQuantity = reservedQuantity; }
    public int getMinStockAlert() { return minStockAlert; }
    public void setMinStockAlert(int minStockAlert) { this.minStockAlert = minStockAlert; }
    public Instant getUpdatedAt() { return updatedAt; }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
