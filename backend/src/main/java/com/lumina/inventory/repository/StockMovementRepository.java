package com.lumina.inventory.repository;

import com.lumina.inventory.domain.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    /** Backoffice (Fase 5A): movimientos por referencia (ej. "ADMIN_MANUAL" o un orderNumber). */
    List<StockMovement> findByReferenceId(String referenceId);
}
