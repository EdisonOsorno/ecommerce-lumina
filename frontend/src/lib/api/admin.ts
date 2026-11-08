import { extractProblemDetailMessage } from '@/lib/api/problemDetail';
import type {
  AdminInventoryItem,
  AdminOrderSummary,
  AdminProduct,
  CreateProductPayload,
  InventoryAdjustPayload,
  UpdateProductPayload,
} from '@/types/admin';
import type { OrderResponse } from '@/types/orders';

const API_BASE_URL = '/api/admin';

/**
 * Peticiones del backoffice: siempre con Authorization: Bearer.
 * El backend responde 403 (sin sesión / cliente común) o 404 (recurso
 * inexistente) vía Problem Detail; extraemos el detail amigable al fallar.
 */
async function adminRequest<T>(
  method: 'GET' | 'PATCH' | 'POST' | 'PUT',
  url: string,
  token: string,
  body?: unknown,
  fallbackMessage = 'No fue posible completar la operación administrativa.'
): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(await extractProblemDetailMessage(response, fallbackMessage));
  }
  return response.json() as Promise<T>;
}

/**
 * Listado de TODAS las órdenes del sistema (clientes e invitados),
 * de la más reciente a la más antigua, con filtro opcional por estado.
 */
export function getAdminOrders(
  token: string,
  status?: string
): Promise<AdminOrderSummary[]> {
  const url = status
    ? `${API_BASE_URL}/orders?status=${encodeURIComponent(status)}`
    : `${API_BASE_URL}/orders`;
  return adminRequest<AdminOrderSummary[]>(
    'GET',
    url,
    token,
    undefined,
    'No fue posible cargar los pedidos del sistema.'
  );
}

/** Transición de estado del ciclo de vida (PAID → SHIPPED → DELIVERED, o CANCELLED). */
export function updateAdminOrderStatus(
  token: string,
  orderNumber: string,
  status: string
): Promise<OrderResponse> {
  return adminRequest<OrderResponse>(
    'PATCH',
    `${API_BASE_URL}/orders/${encodeURIComponent(orderNumber)}/status`,
    token,
    { status },
    'No fue posible actualizar el estado del pedido.'
  );
}

/** Listado completo de productos con su stock, precio y alerta mínima. */
export function getAdminInventory(token: string): Promise<AdminInventoryItem[]> {
  return adminRequest<AdminInventoryItem[]>(
    'GET',
    `${API_BASE_URL}/inventory`,
    token,
    undefined,
    'No fue posible cargar el inventario.'
  );
}

/**
 * Ajuste manual de stock auditado: delta positivo = entrada
 * (reabastecimiento), negativo = salida (merma/baja).
 */
export function adjustAdminInventory(
  token: string,
  payload: InventoryAdjustPayload
): Promise<AdminInventoryItem> {
  return adminRequest<AdminInventoryItem>(
    'POST',
    `${API_BASE_URL}/inventory/adjust`,
    token,
    payload,
    'No fue posible aplicar el ajuste de inventario.'
  );
}

/**
 * Listado admin de TODOS los productos (activos e inactivos),
 * de más nuevo a más antiguo, con su stock disponible.
 */
export function getAdminProducts(token: string): Promise<AdminProduct[]> {
  return adminRequest<AdminProduct[]>(
    'GET',
    `${API_BASE_URL}/products`,
    token,
    undefined,
    'No fue posible cargar los productos del catálogo.'
  );
}

/**
 * Crea un producto: el backend genera el slug desde el nombre, crea el
 * inventario inicial y registra el movimiento de stock cuando trae unidades.
 */
export function createAdminProduct(
  token: string,
  payload: CreateProductPayload
): Promise<AdminProduct> {
  return adminRequest<AdminProduct>(
    'POST',
    `${API_BASE_URL}/products`,
    token,
    payload,
    'No fue posible crear el producto.'
  );
}

/** Edita los datos comerciales (SKU y slug no cambian; vatRate nulo conserva el vigente). */
export function updateAdminProduct(
  token: string,
  id: number,
  payload: UpdateProductPayload
): Promise<AdminProduct> {
  return adminRequest<AdminProduct>(
    'PUT',
    `${API_BASE_URL}/products/${id}`,
    token,
    payload,
    'No fue posible actualizar el producto.'
  );
}

/** Soft delete (INVIMA/descontinuación): invierte is_active sin borrado físico. */
export function toggleAdminProductStatus(
  token: string,
  id: number
): Promise<AdminProduct> {
  return adminRequest<AdminProduct>(
    'PATCH',
    `${API_BASE_URL}/products/${id}/toggle-status`,
    token,
    undefined,
    'No fue posible cambiar el estado del producto.'
  );
}
