package com.lumina.orders.repository;

import com.lumina.orders.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /** Consulta la orden por su número público junto con sus items (evita N+1). */
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.orderNumber = :orderNumber")
    Optional<Order> findByOrderNumber(@Param("orderNumber") String orderNumber);

    /** Existencia de número público (para generar números únicos sin traer la orden). */
    boolean existsByOrderNumber(String orderNumber);
}
