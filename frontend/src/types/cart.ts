/**
 * Representa un ítem dentro del carrito de compras.
 * Se persiste en sessionStorage para que sobreviva recargas de página
 * pero NO entre sesiones de navegador (cierre de pestaña lo elimina).
 *
 * ¿Por qué sessionStorage y no localStorage?
 *   - El carrito es temporal: si el usuario cierra la pestaña, asumir
 *     que abandonó la compra. localStorage haría que productos "viejos"
 *     reaparezcan inesperadamente meses después.
 */
export interface CartItem {
  /** ID del producto (del backend) */
  productId: number;
  /** Nombre (snapshot al agregar — no cambia si el backend lo actualiza) */
  name: string;
  /** Slug para poder linkear de vuelta al detalle */
  slug: string;
  /** URL de la imagen (snapshot) */
  imageUrl: string;
  /** Precio unitario CON IVA en COP (snapshot al momento de agregar) */
  unitPrice: number;
  /** Cantidad de unidades */
  quantity: number;
  /** Stock disponible al momento de agregar (para validar máximos en el front) */
  maxStock: number;
}

/**
 * Estado completo del carrito — lo que el context expone.
 */
export interface CartState {
  items: CartItem[];
}

/**
 * Acciones que puede despachar el reducer del carrito.
 */
export type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: number; quantity: number } }
  | { type: 'CLEAR_CART' };
