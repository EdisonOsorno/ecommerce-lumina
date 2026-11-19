package com.lumina.admin.metrics.service;

import com.lumina.admin.metrics.dto.AdminDashboardMetricsResponse;
import com.lumina.admin.metrics.dto.FinancialSummaryResponse;
import com.lumina.admin.metrics.dto.OrderStatusBreakdownResponse;
import com.lumina.admin.metrics.dto.ProductLowDemandMetricResponse;
import com.lumina.admin.metrics.dto.ProductSalesMetricResponse;
import com.lumina.catalog.domain.Product;
import com.lumina.catalog.repository.ProductRepository;
import com.lumina.inventory.domain.InventoryItem;
import com.lumina.inventory.repository.InventoryItemRepository;
import com.lumina.orders.domain.OrderStatus;
import com.lumina.orders.repository.OrderItemRepository;
import com.lumina.orders.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Métricas y analítica comercial del backoffice (Fase 5F).
 *
 * El ingreso real se calcula SOLO con pedidos completados (PAID, SHIPPED,
 * DELIVERED); cancelados y reembolsados se contabilizan como pérdida. Los
 * pendientes de pago se informan aparte. Todo se recalcula en el backend a
 * partir de las órdenes persistidas (nunca de valores del frontend).
 */
@Service
public class AdminMetricsService {

    /** Cantidad máxima de productos en el ranking de más vendidos. */
    private static final int TOP_PRODUCTS_LIMIT = 10;

    /** Hasta este número de unidades se considera "pocas ventas" (baja rotación). */
    private static final long LOW_DEMAND_MAX_UNITS_SOLD = 5;

    private static final String SIN_VENTAS = "SIN_VENTAS";
    private static final String BAJA_ROTACION = "BAJA_ROTACION";

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public AdminMetricsService(OrderRepository orderRepository,
                               OrderItemRepository orderItemRepository,
                               ProductRepository productRepository,
                               InventoryItemRepository inventoryItemRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    /** Construye el dashboard completo en una sola transacción de solo lectura. */
    @Transactional(readOnly = true)
    public AdminDashboardMetricsResponse getDashboardMetrics() {
        Map<OrderStatus, Object[]> rowsByStatus = loadStatusRows();
        FinancialSummaryResponse financialSummary = buildFinancialSummary(rowsByStatus);
        List<OrderStatusBreakdownResponse> ordersByStatus = buildStatusBreakdown(rowsByStatus);

        Map<Long, Product> productsById = productRepository.findAll().stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        Map<Long, Integer> stockByProductId = inventoryItemRepository.findAll().stream()
                .collect(Collectors.toMap(
                        item -> item.getProduct().getId(),
                        InventoryItem::getAvailableQuantity));

        List<ProductSales> sales = orderItemRepository.findProductSalesForCompletedOrders().stream()
                .map(this::toProductSales)
                .toList();
        Map<Long, ProductSales> salesByProductId = sales.stream()
                .collect(Collectors.toMap(ProductSales::productId, Function.identity(), (a, b) -> a));

        return new AdminDashboardMetricsResponse(
                financialSummary,
                buildTopSellingProducts(sales, productsById, stockByProductId),
                buildLowDemandProducts(productsById, stockByProductId, salesByProductId),
                ordersByStatus);
    }

    // ------------------------------------------------------------------
    // Resumen financiero
    // ------------------------------------------------------------------

    private FinancialSummaryResponse buildFinancialSummary(Map<OrderStatus, Object[]> rowsByStatus) {
        long completedOrdersCount = 0L;
        BigDecimal completedOrdersRevenue = BigDecimal.ZERO;
        long cancelledOrdersCount = 0L;
        BigDecimal cancelledOrdersLoss = BigDecimal.ZERO;
        long refundedOrdersCount = 0L;
        BigDecimal refundedOrdersLoss = BigDecimal.ZERO;
        long pendingOrdersCount = 0L;
        BigDecimal pendingOrdersTotal = BigDecimal.ZERO;

        for (OrderStatus status : OrderStatus.values()) {
            Object[] row = rowsByStatus.get(status);
            long count = row == null ? 0L : toLong(row[1]);
            BigDecimal total = row == null ? BigDecimal.ZERO : toBigDecimal(row[2]);

            switch (status) {
                case PAID, SHIPPED, DELIVERED -> {
                    completedOrdersCount += count;
                    completedOrdersRevenue = completedOrdersRevenue.add(total);
                }
                case CANCELLED -> {
                    cancelledOrdersCount = count;
                    cancelledOrdersLoss = total;
                }
                case REFUNDED -> {
                    refundedOrdersCount = count;
                    refundedOrdersLoss = total;
                }
                case PENDING_PAYMENT -> {
                    pendingOrdersCount = count;
                    pendingOrdersTotal = total;
                }
            }
        }

        return new FinancialSummaryResponse(
                completedOrdersCount,
                completedOrdersRevenue,
                cancelledOrdersCount,
                cancelledOrdersLoss,
                refundedOrdersCount,
                refundedOrdersLoss,
                pendingOrdersCount,
                pendingOrdersTotal,
                completedOrdersRevenue,
                cancelledOrdersLoss.add(refundedOrdersLoss));
    }

    // ------------------------------------------------------------------
    // Ranking de productos más vendidos
    // ------------------------------------------------------------------

    private List<ProductSalesMetricResponse> buildTopSellingProducts(
            List<ProductSales> sales,
            Map<Long, Product> productsById,
            Map<Long, Integer> stockByProductId) {
        return sales.stream()
                .sorted(Comparator.comparingLong(ProductSales::unitsSold).reversed()
                        .thenComparing(Comparator.comparing(ProductSales::totalRevenue).reversed()))
                .limit(TOP_PRODUCTS_LIMIT)
                .map(sale -> new ProductSalesMetricResponse(
                        sale.productId(),
                        sale.productName(),
                        sale.productSku(),
                        categoryName(productsById.get(sale.productId())),
                        sale.unitsSold(),
                        sale.totalRevenue(),
                        stockByProductId.getOrDefault(sale.productId(), 0)))
                .toList();
    }

    // ------------------------------------------------------------------
    // Productos de baja demanda / sin ventas
    // ------------------------------------------------------------------

    private List<ProductLowDemandMetricResponse> buildLowDemandProducts(
            Map<Long, Product> productsById,
            Map<Long, Integer> stockByProductId,
            Map<Long, ProductSales> salesByProductId) {
        return productsById.values().stream()
                .filter(Product::isActive)
                .map(product -> {
                    ProductSales sale = salesByProductId.get(product.getId());
                    long unitsSold = sale == null ? 0L : sale.unitsSold();
                    return new ProductLowDemandMetricResponse(
                            product.getId(),
                            product.getName(),
                            product.getSku(),
                            categoryName(product),
                            unitsSold,
                            stockByProductId.getOrDefault(product.getId(), 0),
                            unitsSold == 0L ? SIN_VENTAS : BAJA_ROTACION);
                })
                .filter(metric -> metric.unitsSold() <= LOW_DEMAND_MAX_UNITS_SOLD)
                // Primero los que no venden; a igualdad de ventas, más stock acumulado primero
                .sorted(Comparator.comparingLong(ProductLowDemandMetricResponse::unitsSold)
                        .thenComparing(Comparator
                                .comparingInt(ProductLowDemandMetricResponse::currentStock)
                                .reversed()))
                .toList();
    }

    // ------------------------------------------------------------------
    // Desglose por estado
    // ------------------------------------------------------------------

    private List<OrderStatusBreakdownResponse> buildStatusBreakdown(
            Map<OrderStatus, Object[]> rowsByStatus) {
        List<OrderStatusBreakdownResponse> breakdown = new ArrayList<>();
        for (OrderStatus status : OrderStatus.values()) {
            Object[] row = rowsByStatus.get(status);
            breakdown.add(new OrderStatusBreakdownResponse(
                    status,
                    statusLabel(status),
                    row == null ? 0L : toLong(row[1]),
                    row == null ? BigDecimal.ZERO : toBigDecimal(row[2])));
        }
        return breakdown;
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private Map<OrderStatus, Object[]> loadStatusRows() {
        Map<OrderStatus, Object[]> rowsByStatus = new EnumMap<>(OrderStatus.class);
        for (Object[] row : orderRepository.countAndSumTotalByStatus()) {
            rowsByStatus.put((OrderStatus) row[0], row);
        }
        return rowsByStatus;
    }

    private ProductSales toProductSales(Object[] row) {
        return new ProductSales(
                (Long) row[0],
                (String) row[1],
                (String) row[2],
                toLong(row[3]),
                toBigDecimal(row[4]));
    }

    private static String categoryName(Product product) {
        return product != null && product.getCategory() != null
                ? product.getCategory().getName()
                : "Sin categoría";
    }

    private static String statusLabel(OrderStatus status) {
        return switch (status) {
            case PENDING_PAYMENT -> "Pendiente de pago";
            case PAID -> "Pagado";
            case SHIPPED -> "Enviado";
            case DELIVERED -> "Entregado";
            case CANCELLED -> "Cancelado";
            case REFUNDED -> "Reembolsado";
        };
    }

    private static long toLong(Object value) {
        return value instanceof Number number ? number.longValue() : 0L;
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        return new BigDecimal(value.toString());
    }

    /** Agregado interno de ventas por producto (una fila de la consulta). */
    private record ProductSales(
            Long productId,
            String productName,
            String productSku,
            long unitsSold,
            BigDecimal totalRevenue) {
    }
}
