package com.lumina.orders.service;

import com.lumina.catalog.domain.Product;
import com.lumina.catalog.repository.ProductRepository;
import com.lumina.inventory.domain.InventoryItem;
import com.lumina.inventory.domain.StockMovement;
import com.lumina.inventory.repository.InventoryItemRepository;
import com.lumina.inventory.repository.StockMovementRepository;
import com.lumina.orders.domain.Order;
import com.lumina.orders.domain.OrderItem;
import com.lumina.orders.domain.OrderStatus;
import com.lumina.orders.dto.CreateOrderItemRequest;
import com.lumina.orders.dto.CreateOrderRequest;
import com.lumina.orders.dto.OrderItemResponse;
import com.lumina.orders.dto.OrderResponse;
import com.lumina.orders.repository.OrderRepository;
import com.lumina.shared.errors.InsufficientStockException;
import com.lumina.shared.errors.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * Servicio transaccional de pedidos.
 *
 * Garantías clave (reglas de oro de Fase 3C):
 *  - Los precios NUNCA vienen del frontend: se recalculan aquí con BigDecimal
 *    leyendo los precios vigentes de la tabla products.
 *  - Reserva atómica de inventario con bloqueo pesimista (SELECT FOR UPDATE):
 *    dos pedidos concurrentes sobre el mismo producto se serializan y el stock
 *    disponible se valida varias veces por transacción, evitando overselling.
 *  - Todo el flujo es una única transacción: si cualquier validación falla,
 *    se revierte tanto la orden como la reserva de inventario.
 */
@Service
public class OrderService {

    private static final String MOVEMENT_TYPE_RESERVE = "OUT_RESERVE_ORDER";
    private static final int ORDER_NUMBER_RANDOM_LENGTH = 4;
    private static final int ORDER_NUMBER_MAX_ATTEMPTS = 5; // Reintentos ante colisión improbable del sufijo aleatorio

    /** Umbral de envío gratis en COP (regla de negocio acordada con el Product Owner). */
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("100000.00");
    /** Costo de envío estándar COP cuando el total no supera el umbral. */
    private static final BigDecimal STANDARD_SHIPPING_COST = new BigDecimal("12000.00");

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final StockMovementRepository stockMovementRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        InventoryItemRepository inventoryItemRepository,
                        StockMovementRepository stockMovementRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.stockMovementRepository = stockMovementRepository;
    }

    /**
     * Crea la orden en un solo paso transaccional:
     * 1) bloquea y valida el inventario por cada producto, 2) reduce disponible
     * y suma a reservado, 3) registra el movimiento OUT_RESERVE_ORDER,
     * 4) recalcula bases/IVA/totales con los precios vigentes y 5) persiste.
     *
     * @param authenticatedUserId ID del usuario con Bearer token, o null como invitado
     */
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, Long authenticatedUserId) {
        // TreeMap: iteración por productId ascendente → orden de bloqueo consistente,
        // evita deadlocks cuando dos pedidos piden varios productos en distinto orden.
        Map<Long, Integer> quantities = new TreeMap<>(request.items().stream()
                .collect(Collectors.groupingBy(
                        CreateOrderItemRequest::productId,
                        Collectors.summingInt(CreateOrderItemRequest::quantity)
                )));

        Order order = new Order();
        order.setOrderNumber(generateUniqueOrderNumber());
        order.setUserId(authenticatedUserId); // NULL = compra como invitado
        order.setCustomerName(request.customerName().trim());
        order.setCustomerEmail(request.customerEmail().trim().toLowerCase());
        order.setCustomerPhone(request.customerPhone() == null || request.customerPhone().isBlank()
                ? null : request.customerPhone().trim());
        order.setShippingAddress(request.shippingAddress().trim());
        order.setShippingCity(request.shippingCity().trim());
        order.setShippingDepartment(request.shippingDepartment().trim());
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        // shippingCost se calcula tras conocer el total bruto del pedido (regla de envío)

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal vatTotal = BigDecimal.ZERO;
        BigDecimal grossTotal = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
            Long productId = entry.getKey();
            int quantity = entry.getValue();

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "El producto " + productId + " no existe"));

            if (!product.isActive()) {
                throw new InsufficientStockException(
                        "El producto '" + product.getName() + "' no está disponible para compra");
            }

            // BLOQUEO PESIMISTA: para la fila de inventario hasta el commit (anti-overselling)
            InventoryItem inventory = inventoryItemRepository.findByProductIdWithLock(productId)
                    .orElseThrow(() -> new InsufficientStockException(
                            "El producto '" + product.getName() + "' no tiene inventario registrado"));

            if (inventory.getAvailableQuantity() < quantity) {
                throw new InsufficientStockException(
                        "Stock insuficiente para '" + product.getName() + "': solicitado "
                                + quantity + ", disponible " + inventory.getAvailableQuantity());
            }

            // Reserva atómica: disponible baja, reservado sube (el stock total no cambia aún)
            inventory.setAvailableQuantity(inventory.getAvailableQuantity() - quantity);
            inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);

            // Auditoría del movimiento de reserva
            StockMovement movement = new StockMovement();
            movement.setProduct(product);
            movement.setMovementType(MOVEMENT_TYPE_RESERVE);
            movement.setQuantity(-quantity); // Salida de inventario (valor negativo por convención de auditoría)
            movement.setBalanceAfter(inventory.getAvailableQuantity());
            movement.setReason("Reserva de stock para pedido");
            movement.setReferenceId(order.getOrderNumber());
            stockMovementRepository.save(movement);

            // Recalculo de dinero en backend: el precio vigente es el único dato de verdad.
            // Los precios de Lúmina incluyen IVA (tax-included), por lo que por línea se
            // desglosa base + IVA para reportar el impuesto, mientras line_total es el bruto pagado.
            BigDecimal gross = product.getPrice().multiply(BigDecimal.valueOf(quantity))
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal vatDivisor = BigDecimal.ONE.add(product.getVatRate());
            BigDecimal base = gross.divide(vatDivisor, 2, RoundingMode.HALF_UP);
            BigDecimal vat = gross.subtract(base);

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(product.getId());
            orderItem.setProductName(product.getName());
            orderItem.setProductSku(product.getSku());
            orderItem.setUnitPrice(product.getPrice());
            orderItem.setVatRate(product.getVatRate());
            orderItem.setQuantity(quantity);
            orderItem.setLineTotal(gross);
            order.addItem(orderItem);

            subtotal = subtotal.add(base);
            vatTotal = vatTotal.add(vat);
            grossTotal = grossTotal.add(gross);
        }

        // Regla de envío: gratis si el total bruto del pedido ≥ $100.000 COP; $12.000 COP en caso contrario
        BigDecimal shippingCost = grossTotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0
                ? BigDecimal.ZERO.setScale(2)
                : STANDARD_SHIPPING_COST;

        order.setShippingCost(shippingCost);
        order.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        order.setVatTotal(vatTotal.setScale(2, RoundingMode.HALF_UP));
        order.setTotalAmount(grossTotal.add(shippingCost));

        Order saved = orderRepository.save(order); // CASCADE persiste los items

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe un pedido con el número: " + orderNumber));
        return toResponse(order);
    }

    /** Número legible: LUM-20261030-K7Q2. Reintenta ante colisión (probabilidad ínfima, SecureRandom 32 símbolos). */
    private String generateUniqueOrderNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        for (int attempt = 0; attempt < ORDER_NUMBER_MAX_ATTEMPTS; attempt++) {
            String candidate = "LUM-" + datePart + "-" + randomSuffix(ORDER_NUMBER_RANDOM_LENGTH);
            if (!orderRepository.existsByOrderNumber(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("No se pudo generar un número de pedido único. Reintenta.");
    }

    private String randomSuffix(int length) {
        // Sin caracteres ambiguos (I, O, 0, 1) para que el número sea leible por teléfono
        final String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder suffix = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            suffix.append(alphabet.charAt(secureRandom.nextInt(alphabet.length())));
        }
        return suffix.toString();
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getProductId(),
                        item.getProductName(),
                        item.getProductSku(),
                        item.getUnitPrice(),
                        item.getQuantity(),
                        item.getLineTotal()
                ))
                .toList();
        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getCustomerName(),
                order.getCustomerEmail(),
                order.getShippingAddress(),
                order.getShippingCity(),
                order.getSubtotal(),
                order.getVatTotal(),
                order.getShippingCost(),
                order.getTotalAmount(),
                order.getStatus().name(),
                order.getCreatedAt(),
                items
        );
    }
}
