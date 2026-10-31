package com.lumina.orders.controller;

import com.lumina.orders.dto.CreateOrderRequest;
import com.lumina.orders.dto.OrderResponse;
import com.lumina.orders.dto.OrderSummaryResponse;
import com.lumina.orders.service.OrderService;
import com.lumina.users.domain.User;
import com.lumina.users.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * API de órdenes. POST permite compra como invitado: si hay Bearer token y es
 * válido, el filtro JWT ya cargó la Authentication y se asigna el user_id;
 * de lo contrario la orden se registra como invitado (user_id NULL).
 *
 * El blindaje IDOR del detalle vive en OrderService.getOrderByNumberSecure.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(OrderService orderService, UserRepository userRepository) {
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request,
                                                Authentication authentication) {
        Long userId = resolveAuthenticatedUserId(authentication);
        OrderResponse response = orderService.createOrder(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** Historial "Mi Cuenta": requiere sesión (reforzada en SecurityConfig antes que las rutas públicas). */
    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderSummaryResponse>> getMyOrders(Authentication authentication) {
        return ResponseEntity.ok(orderService.getMyOrders(authentication.getName()));
    }

    /** Consulta pública para invitados; con sesión activa aplica la regla IDOR de dueño/ADMIN. */
    @GetMapping("/{orderNumber}")
    public ResponseEntity<OrderResponse> getByOrderNumber(@PathVariable String orderNumber,
                                                          Authentication authentication) {
        return ResponseEntity.ok(orderService.getOrderByNumberSecure(orderNumber, authentication));
    }

    /** Traduce el principal (email del JWT) al ID de la tabla users; null si es invitado. */
    private Long resolveAuthenticatedUserId(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .map(User::getId)
                .orElse(null);
    }
}
