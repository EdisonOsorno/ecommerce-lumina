/**
 * Regla de envío de Lúmina — espejo de OrderService (backend).
 * Fuente única de verdad del criterio en el frontend, usada por
 * CartPage (indicador) y CheckoutPage (resumen).
 */

/** Umbral de envío gratis en COP */
export const FREE_SHIPPING_THRESHOLD = 100_000;

/** Costo de envío estándar en COP cuando el total no supera el umbral */
export const STANDARD_SHIPPING_COST = 12_000;

/** Calcula el costo de envío según el total bruto del pedido (IVA incluido). */
export function calculateShippingCost(totalWithVat: number): number {
  if (totalWithVat >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  return STANDARD_SHIPPING_COST;
}
