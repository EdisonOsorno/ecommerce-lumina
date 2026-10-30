import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import type { CartItem, CartState, CartAction } from '@/types/cart';

/* ====================================================================
 * 1. REDUCER — lógica pura de negocio del carrito
 * ==================================================================== */

/**
 * Reducer inmutable para el carrito de compras.
 *
 * Decisiones de diseño:
 * - ADD_ITEM: si el producto ya existe en el carrito, SUMA la cantidad
 *   (en vez de reemplazar). Así el usuario puede agregar 2 desde el detalle
 *   y luego 3 más sin perder los primeros 2.
 * - La cantidad nunca excede maxStock del item.
 * - REMOVE_ITEM filtra por productId.
 * - CLEAR_CART vacía todo (se usará tras completar un pedido).
 */
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (item) => item.productId === action.payload.productId
      );

      if (existing) {
        // Sumar cantidad, respetando máximo de stock
        const newQty = Math.min(
          existing.quantity + action.payload.quantity,
          action.payload.maxStock
        );
        return {
          ...state,
          items: state.items.map((item) =>
            item.productId === action.payload.productId
              ? { ...item, quantity: newQty, maxStock: action.payload.maxStock }
              : item
          ),
        };
      }

      // Producto nuevo — agregar al final
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (item) => item.productId !== action.payload.productId
        ),
      };

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        // Si la cantidad llega a 0 o negativo, eliminar
        return {
          ...state,
          items: state.items.filter((item) => item.productId !== productId),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(quantity, item.maxStock) }
            : item
        ),
      };
    }

    case 'CLEAR_CART':
      return { items: [] };

    default:
      return state;
  }
}

/* ====================================================================
 * 2. PERSISTENCIA en sessionStorage
 * ==================================================================== */

const STORAGE_KEY = 'lumina_cart';

function loadCartFromStorage(): CartState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartState;
      if (Array.isArray(parsed.items)) {
        return parsed;
      }
    }
  } catch {
    // Si el JSON está corrupto, empezar limpio
  }
  return { items: [] };
}

function saveCartToStorage(state: CartState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage lleno o deshabilitado — silenciar
  }
}

/* ====================================================================
 * 3. CONTEXT — proveedor y hook
 * ==================================================================== */

interface CartContextValue {
  /** Estado actual del carrito */
  state: CartState;
  /** Agregar un producto al carrito */
  addItem: (item: CartItem) => void;
  /** Eliminar un producto completo */
  removeItem: (productId: number) => void;
  /** Cambiar la cantidad de un producto */
  updateQuantity: (productId: number, quantity: number) => void;
  /** Vaciar todo el carrito */
  clearCart: () => void;
  /** Número total de unidades en el carrito */
  totalItems: number;
  /** Subtotal en COP con IVA incluido */
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

/**
 * Proveedor del carrito — envolver la app con este componente.
 *
 * Usa useReducer (en vez de useState) porque la lógica de actualización
 * tiene múltiples caminos (agregar, sumar cantidad, eliminar, vaciar)
 * y un reducer centraliza y testea esa lógica de forma predecible.
 */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCartFromStorage);

  // Persistir en sessionStorage cada vez que cambie el estado
  useEffect(() => {
    saveCartToStorage(state);
  }, [state]);

  // Acciones memorizadas para no re-crear funciones en cada render
  const addItem = useCallback(
    (item: CartItem) => dispatch({ type: 'ADD_ITEM', payload: item }),
    []
  );

  const removeItem = useCallback(
    (productId: number) => dispatch({ type: 'REMOVE_ITEM', payload: { productId } }),
    []
  );

  const updateQuantity = useCallback(
    (productId: number, quantity: number) =>
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } }),
    []
  );

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  // Valores derivados calculados solo cuando cambian los items
  const totalItems = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items]
  );

  const totalPrice = useMemo(
    () => state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [state.items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [state, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

/**
 * Hook para consumir el carrito desde cualquier componente.
 *
 * Lanza error si se usa fuera del CartProvider — esto es intencional
 * para detectar bugs durante el desarrollo.
 */
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error(
      'useCart() debe usarse dentro de un <CartProvider>. ' +
      '¿Falta envolver la app con CartProvider en main.tsx?'
    );
  }
  return context;
}
