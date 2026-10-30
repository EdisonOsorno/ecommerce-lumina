import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, Minus, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCart } from '@/features/cart/CartContext';
import { formatCurrency } from '@/lib/formatting/currency';
import { BRAND } from '@/config/brand';
import { Button } from '@/components/ui/Button';
import './CartPage.css';

/**
 * Página del Carrito de Compras (/carrito).
 *
 * Muestra todos los productos agregados, permite ajustar cantidades,
 * eliminar items, vaciar el carrito y ver el resumen de totales.
 *
 * Cuando el carrito está vacío, muestra un estado amigable con
 * enlace al catálogo.
 */
export const CartPage: React.FC = () => {
  const { state, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  /* ---- Estado vacío ---- */
  if (state.items.length === 0) {
    return (
      <div className="container cart-page">
        <div className="cart-empty">
          <ShoppingBag size={64} className="cart-empty__icon" aria-hidden="true" />
          <h2 className="cart-empty__title">Tu bolsa está vacía</h2>
          <p className="cart-empty__text">
            Aún no has agregado productos. Explora nuestro catálogo y
            encuentra los productos perfectos para tu rutina de belleza.
          </p>
          <Link to="/catalogo">
            <Button variant="primary" leftIcon={<ArrowRight size={18} />}>
              Explorar catálogo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  /**
   * Calcula el desglose de IVA.
   * Como todos nuestros productos usan 19% de IVA y el precio ya lo incluye:
   *   precioBase = precioConIva / 1.19
   *   iva = precioConIva - precioBase
   */
  const vatRate = 0.19;
  const subtotalSinIva = totalPrice / (1 + vatRate);
  const ivaTotal = totalPrice - subtotalSinIva;

  return (
    <div className="container cart-page">
      {/* Encabezado */}
      <div className="cart-page__header">
        <ShoppingBag size={28} aria-hidden="true" />
        <h1 className="cart-page__title">
          Tu Bolsa de Compras
          <span className="cart-page__count"> ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})</span>
        </h1>
      </div>

      {/* Layout: items + resumen */}
      <div className="cart-layout">
        {/* Lista de productos */}
        <div className="cart-items" role="list" aria-label="Productos en tu bolsa">
          {state.items.map((item) => (
            <article key={item.productId} className="cart-item" role="listitem">
              {/* Imagen */}
              <Link to={`/producto/${item.slug}`} className="cart-item__image-box">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="cart-item__image"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = BRAND.defaultProductImage;
                  }}
                />
              </Link>

              {/* Info + cantidad */}
              <div className="cart-item__details">
                <Link to={`/producto/${item.slug}`} className="cart-item__name">
                  {item.name}
                </Link>
                <span className="cart-item__unit-price">
                  {formatCurrency(item.unitPrice)} c/u
                </span>

                {/* Selector de cantidad */}
                <div className="cart-item__quantity-row" role="group" aria-label={`Cantidad de ${item.name}`}>
                  <button
                    type="button"
                    className="cart-item__qty-btn"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label="Disminuir cantidad"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="cart-item__qty-value" aria-live="polite" aria-atomic="true">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="cart-item__qty-btn"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxStock}
                    aria-label="Aumentar cantidad"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Total de línea + botón eliminar */}
              <div className="cart-item__right">
                <span className="cart-item__line-total">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
                <button
                  type="button"
                  className="cart-item__remove-btn"
                  onClick={() => removeItem(item.productId)}
                  aria-label={`Eliminar ${item.name} del carrito`}
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </article>
          ))}

          {/* Link para seguir comprando */}
          <Link to="/catalogo" className="cart-page__continue-link">
            <ArrowLeft size={16} />
            Seguir comprando
          </Link>
        </div>

        {/* Resumen de compra */}
        <aside className="cart-summary" aria-label="Resumen de tu compra">
          <h2 className="cart-summary__title">Resumen del Pedido</h2>

          <div className="cart-summary__row">
            <span>Subtotal ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})</span>
            <span>{formatCurrency(subtotalSinIva)}</span>
          </div>
          <div className="cart-summary__row">
            <span>IVA (19%)</span>
            <span>{formatCurrency(ivaTotal)}</span>
          </div>
          <div className="cart-summary__row">
            <span>Envío</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>Gratis</span>
          </div>
          <div className="cart-summary__row cart-summary__row--total">
            <span>Total</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
          <p className="cart-summary__iva-note">
            Precios con IVA incluido
          </p>

          <div className="cart-summary__actions">
            <Button
              variant="primary"
              size="lg"
              style={{ width: '100%' }}
              leftIcon={<ArrowRight size={18} />}
              disabled
            >
              Proceder al pago
            </Button>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              El módulo de checkout se habilitará en la sub-fase 3C.
            </p>
            <button
              type="button"
              className="cart-summary__clear-btn"
              onClick={clearCart}
            >
              <Trash2 size={14} />
              Vaciar bolsa
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
