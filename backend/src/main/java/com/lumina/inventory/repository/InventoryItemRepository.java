package com.lumina.inventory.repository;

import com.lumina.inventory.domain.InventoryItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    Optional<InventoryItem> findByProductId(Long productId);

    /**
     * Lectura con bloqueo pesimista (SELECT ... FOR UPDATE) para la reserva
     * de inventario en compras: serializa transacciones concurrentes sobre
     * la misma fila y evita sobreventa (overselling).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM InventoryItem i WHERE i.product.id = :productId")
    Optional<InventoryItem> findByProductIdWithLock(@Param("productId") Long productId);
}
