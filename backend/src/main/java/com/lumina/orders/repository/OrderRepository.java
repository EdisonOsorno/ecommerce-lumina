package com.lumina.orders.repository;

import com.lumina.orders.domain.Order;
import com.lumina.orders.domain.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /** Consulta la orden por su número público junto con sus items (evita N+1). */
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.orderNumber = :orderNumber")
    Optional<Order> findByOrderNumber(@Param("orderNumber") String orderNumber);

    /** Existencia de número público (para generar números únicos sin traer la orden). */
    boolean existsByOrderNumber(String orderNumber);

    /** Historial de órdenes de un usuario, de la más reciente a la más antigua. */
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Backoffice (Fase 5A): todas las órdenes del sistema, de la más reciente a la más antigua. */
    List<Order> findAllByOrderByCreatedAtDesc();

    /** Backoffice (Fase 5A): órdenes filtradas por estado comercial, de la más reciente a la más antigua. */
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);
}
