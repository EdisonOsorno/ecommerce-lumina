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

/** Producto completo visto desde el backoffice (AdminProductResponse). */
export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  categoryId: number;
  categoryName: string;
  price: number;
  compareAtPrice?: number;
  vatRate: number;
  imageUrl?: string;
  /** Soft delete: false = oculto del catálogo público (INVIMA/descontinuación) */
  active: boolean;
  featured: boolean;
  availableQuantity: number;
  /** ISO Instant */
  createdAt: string;
}

/** Cuerpo del POST /api/admin/products (CreateProductRequest). El slug lo genera el backend. */
export interface CreateProductPayload {
  name: string;
  sku: string;
  categoryId: number;
  description?: string;
  imageUrl?: string;
  price: number;
  compareAtPrice?: number;
  vatRate?: number;
  initialStock: number;
}

/** Cuerpo del PUT /api/admin/products/{id} (UpdateProductRequest). SKU y slug no cambian. */
export interface UpdateProductPayload {
  name: string;
  categoryId: number;
  description?: string;
  imageUrl?: string;
  price: number;
  compareAtPrice?: number;
  vatRate?: number;
}
