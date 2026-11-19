package com.lumina.orders.repository;

import com.lumina.orders.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /**
     * Ventas reales por producto (Fase 5F): solo pedidos completados
     * (PAID, SHIPPED, DELIVERED). Los cancelados y reembolsados no cuentan
     * como ingreso ni como rotación positiva.
     *
     * @return filas [productId, productName, productSku, unitsSold, totalRevenue]
     */
    @Query("SELECT oi.productId, oi.productName, oi.productSku, " +
           "COALESCE(SUM(oi.quantity), 0), COALESCE(SUM(oi.lineTotal), 0) " +
           "FROM OrderItem oi JOIN oi.order o " +
           "WHERE o.status IN (com.lumina.orders.domain.OrderStatus.PAID, " +
           "com.lumina.orders.domain.OrderStatus.SHIPPED, " +
           "com.lumina.orders.domain.OrderStatus.DELIVERED) " +
           "GROUP BY oi.productId, oi.productName, oi.productSku " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findProductSalesForCompletedOrders();
}
