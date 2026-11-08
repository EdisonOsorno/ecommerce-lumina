/**
 * Tipos espejo de los DTOs del backoffice (Fase 5A del backend,
 * com.lumina.orders.dto y com.lumina.inventory.dto).
 */

export type AdminOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

/** Resumen administrativo de una orden (AdminOrderSummaryResponse del backend). */
export interface AdminOrderSummary {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  shippingCity: string;
  totalAmount: number;
  status: AdminOrderStatus;
  /** ISO Instant (se convierte a fecha local al mostrar) */
  createdAt: string;
  /** Suma de cantidades de los items (unidades totales del pedido) */
  itemsCount: number;
}

/** Vista de inventario del backoffice (AdminInventoryResponse del backend). */
export interface AdminInventoryItem {
  productId: number;
  productName: string;
  sku: string;
  price: number;
  availableQuantity: number;
  reservedQuantity: number;
  minStockAlert: number;
  categoryName: string;
}

/** Cuerpo del POST /api/admin/inventory/adjust (InventoryAdjustRequest). */
export interface InventoryAdjustPayload {
  productId: number;
  /** Delta distinto de cero: positivo = entrada, negativo = salida/merma */
  quantityDelta: number;
  reason: string;
}
