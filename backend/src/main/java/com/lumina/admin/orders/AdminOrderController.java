package com.lumina.admin.orders;

import com.lumina.orders.domain.OrderStatus;
import com.lumina.orders.dto.AdminOrderSummaryResponse;
import com.lumina.orders.dto.OrderResponse;
import com.lumina.orders.dto.UpdateOrderStatusRequest;
import com.lumina.orders.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Backoffice de pedidos (Fase 5A). Todas las rutas están protegidas por la
 * regla /api/admin/** → hasRole("ADMIN") de SecurityConfig, por lo que aquí
 * NO se aplican las restricciones IDOR del módulo público.
 */
@RestController
@RequestMapping(path = "/api/admin/orders", produces = MediaType.APPLICATION_JSON_VALUE)
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Listado de todas las órdenes del sistema (clientes e invitados),
     * de la más reciente a la más antigua, con filtro opcional por estado.
     *
     * @param estado (opcional) PENDING_PAYMENT | PAID | SHIPPED | DELIVERED | CANCELLED
     */
    @GetMapping
    public List<AdminOrderSummaryResponse> listOrders(
            @RequestParam(name = "status", required = false) OrderStatus status) {
        return orderService.listOrdersForAdmin(status);
    }

    /** Detalle completo de una orden por su número público (admin ve todo, sin IDOR). */
    @GetMapping("/{orderNumber}")
    public OrderResponse getOrderDetail(@PathVariable String orderNumber) {
        return orderService.getOrderDetailForAdmin(orderNumber);
    }

    /**
     * Transición de estado del ciclo de vida comercial
     * (ej. PAID → SHIPPED → DELIVERED). Retorna el detalle ya actualizado.
     */
    @PatchMapping("/{orderNumber}/status")
    public OrderResponse updateStatus(@PathVariable String orderNumber,
                                      @Valid @RequestBody UpdateOrderStatusRequest request) {
        return orderService.updateOrderStatus(orderNumber, request.status());
    }
}
