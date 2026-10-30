import type { CreateOrderRequest, OrderResponse } from '@/types/orders';
import { extractProblemDetailMessage } from '@/lib/api/problemDetail';

const API_BASE_URL = '/api/orders';

/**
 * Registra una orden de compra.
 *
 * - Invitado: llamar SIN token (user_id queda NULL en el backend).
 * - Autenticado: pasar el token JWT de useAuth() para asignar user_id.
 *
 * El backend recalcula los precios y el IVA con BigDecimal; el request
 * solo contiene productos y cantidades, nunca dinero.
 */
export async function createOrder(
  request: CreateOrderRequest,
  token?: string | null
): Promise<OrderResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    // Incluye 409 Conflict con detail descriptivo cuando no hay stock
    throw new Error(await extractProblemDetailMessage(response, 'No fue posible registrar tu pedido.'));
  }
  return response.json();
}

/** Consulta una orden por su número público (comprobante de compra). */
export async function getOrderByNumber(orderNumber: string): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(orderNumber)}`);
  if (response.status === 404) {
    throw new Error('El pedido solicitado no existe o no se encuentra disponible.');
  }
  if (!response.ok) {
    throw new Error(await extractProblemDetailMessage(response, 'No fue posible cargar los datos del pedido.'));
  }
  return response.json();
}
