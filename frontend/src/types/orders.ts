/**
 * Tipos del módulo de órdenes — espejo exacto de los DTOs del backend
 * (com.lumina.orders.dto). Todos los valores monetarios son COP con IVA
 * incluido, recalculados SIEMPRE en el backend (el frontend no envía precios).
 *
 * Nota: el backend (commit b02eade) aún no expone shippingDepartment en
 * OrderResponse; se tipa opcional para reflejar fielmente el contrato real.
 */

export interface CreateOrderItemRequest {
  productId: number;
  /** Cantidad a comprar (>= 1) */
  quantity: number;
}

export interface CreateOrderRequest {
  /** Nombre completo del cliente (se divide en first/last name en el backend) */
  customerName: string;
  customerEmail: string;
  /** Opcional en el backend */
  customerPhone?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingDepartment: string;
  items: CreateOrderItemRequest[];
}

export interface OrderItemResponse {
  productId: number;
  productName: string;
  productSku: string;
  /** Precio unitario con IVA incluido (COP) vigente al momento de la compra */
  unitPrice: number;
  quantity: number;
  /** Total de la línea con IVA incluido (COP) */
  lineTotal: number;
}

export interface OrderResponse {
  id: number;
  /** Número legible público (ej. LUM-20261030-F2BE) */
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  /** Aún no expuesto por el DTO del backend (opcional hasta que lo incluya) */
  shippingDepartment?: string;
  /** Suma de bases gravables (sin IVA) — calculada por el backend */
  subtotal: number;
  /** IVA desglosado — calculado por el backend */
  vatTotal: number;
  /** Costo de envío aplicado (0.00 si el pedido obtuvo envío gratis) */
  shippingCost: number;
  /** Base + IVA + envío (COP) */
  totalAmount: number;
  /** PENDING_PAYMENT | PAID | CANCELLED */
  status: string;
  /** ISO LocalDateTime */
  createdAt: string;
  items: OrderItemResponse[];
}

/**
 * Resumen compacto de una orden para el historial "Mis Pedidos" (Mi Cuenta).
 * Espejo del DTO OrderSummaryResponse del backend (no incluye items ni datos personales).
 */
export interface OrderSummary {
  id: number;
  orderNumber: string;
  /** ISO Instant (se convierte a local al mostrar) */
  createdAt: string;
  totalAmount: number;
  status: string; // 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED'
  /** Suma de cantidades de los items (unidades totales del pedido) */
  itemsCount: number;
}
