import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CreditCard, Landmark, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useCart } from '@/features/cart/CartContext';
import { useAuth } from '@/features/auth/AuthContext';
import { createOrder } from '@/lib/api/orders';
import { calculateShippingCost } from '@/lib/pricing/shipping';
import { formatCurrency } from '@/lib/formatting/currency';
import type { CreateOrderRequest } from '@/types/orders';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { BRAND } from '@/config/brand';
import './checkout.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VAT_RATE = 0.19;

type PaymentMethod = 'card' | 'pse';

/**
 * Página de Checkout (/checkout).
 *
 * Recalcula el desglose y el envío con la MISMA regla del backend
 * (lib/pricing/shipping.ts), pero el dinero real lo determine siempre el
 * backend: el payload solo envía productos y cantidades.
 */
export const CheckoutPage: React.FC = () => {
  const { state, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(() => user?.fullName ?? '');
  const [customerEmail, setCustomerEmail] = useState(() => user?.email ?? '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingDepartment, setShippingDepartment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Regla de oro: entrar a /checkout sin productos redirige a /carrito
  if (state.items.length === 0) {
    return <Navigate to="/carrito" replace />;
  }

  const grossTotal = state.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const subtotalSinIva = grossTotal / (1 + VAT_RATE);
  const ivaTotal = grossTotal - subtotalSinIva;
  const shippingCost = calculateShippingCost(grossTotal);
  const totalAPagar = grossTotal + shippingCost;

  // Regla de oro: compra inhabilitada si faltan campos obligatorios o está procesando
  const isFormIncomplete =
    customerName.trim() === '' ||
    !EMAIL_PATTERN.test(customerEmail.trim()) ||
    shippingAddress.trim() === '' ||
    shippingCity.trim() === '' ||
    shippingDepartment.trim() === '';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    /* Regla de oro: los precios NUNCA viajan desde el frontend; el backend
       recalcula bases, IVA y totales consultando la tabla products (BigDecimal). */
    const request: CreateOrderRequest = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim() === '' ? undefined : customerPhone.trim(),
      shippingAddress: shippingAddress.trim(),
      shippingCity: shippingCity.trim(),
      shippingDepartment: shippingDepartment.trim(),
      items: state.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    setIsLoading(true);
    setError(null);
    try {
      const order = await createOrder(request, token);
      // La compra ya está reservada: vaciar la bolsa y mostrar el comprobante
      clearCart();
      navigate(`/pedido/confirmacion/${encodeURIComponent(order.orderNumber)}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al registrar la compra.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container checkout-page">
      <header className="checkout-page__header">
        <ShoppingCart size={28} aria-hidden="true" />
        <h1 className="checkout-page__title">Finalizar Compra</h1>
      </header>

      <div className="checkout-layout">
        {/* ---------- Columna izquierda: formulario + pago ---------- */}
        <div>
          {error && (
            <Alert
              variant="error"
              title="No pudimos registrar tu pedido"
              style={{ marginBottom: 'var(--space-6)' }}
            >
              {error}
            </Alert>
          )}

          <section className="checkout-card checkout-card--shipping" aria-labelledby="shipping-heading">
            <h2 id="shipping-heading" className="checkout-card__heading">
              Datos de envío
            </h2>
            <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit} noValidate>
              <div className="checkout-form__grid">
                <div className="checkout-form__field">
                  <label htmlFor="checkout-name" className="checkout-form__label">
                    Nombre completo
                  </label>
                  <input
                    id="checkout-name"
                    name="customerName"
                    type="text"
                    className="checkout-form__input"
                    placeholder="Tu nombre completo"
                    autoComplete="name"
                    required
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="checkout-form__field">
                  <label htmlFor="checkout-email" className="checkout-form__label">
                    Email
                  </label>
                  <input
                    id="checkout-email"
                    name="customerEmail"
                    type="email"
                    className="checkout-form__input"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    required
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="checkout-form__field">
                <label htmlFor="checkout-phone" className="checkout-form__label">
                  Teléfono <span className="checkout-form__label--optional">(opcional)</span>
                </label>
                <input
                  id="checkout-phone"
                  name="customerPhone"
                  type="tel"
                  className="checkout-form__input"
                  placeholder="+57 300 000 0000"
                  autoComplete="tel"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="checkout-form__field">
                <label htmlFor="checkout-address" className="checkout-form__label">
                  Dirección
                </label>
                <input
                  id="checkout-address"
                  name="shippingAddress"
                  type="text"
                  className="checkout-form__input"
                  placeholder="Calle 123 #45-67, apartamento 802"
                  autoComplete="street-address"
                  required
                  value={shippingAddress}
                  onChange={(event) => setShippingAddress(event.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="checkout-form__grid">
                <div className="checkout-form__field">
                  <label htmlFor="checkout-city" className="checkout-form__label">
                    Ciudad
                  </label>
                  <input
                    id="checkout-city"
                    name="shippingCity"
                    type="text"
                    className="checkout-form__input"
                    placeholder="Bogotá"
                    required
                    value={shippingCity}
                    onChange={(event) => setShippingCity(event.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="checkout-form__field">
                  <label htmlFor="checkout-department" className="checkout-form__label">
                    Departamento
                  </label>
                  <input
                    id="checkout-department"
                    name="shippingDepartment"
                    type="text"
                    className="checkout-form__input"
                    placeholder="Cundinamarca"
                    required
                    value={shippingDepartment}
                    onChange={(event) => setShippingDepartment(event.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </form>
          </section>

          <section className="checkout-card" aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="checkout-card__heading">
              Método de pago
            </h2>
            <div className="checkout-payment__options" role="radiogroup" aria-label="Método de pago">
              <label
                className={`checkout-payment__option ${
                  paymentMethod === 'card' ? 'checkout-payment__option--selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  disabled={isLoading}
                />
                <CreditCard size={22} aria-hidden="true" className="checkout-payment__icon" />
                <span>
                  <span className="checkout-payment__option-title">Tarjeta Débito/Crédito Demo</span>
                  <span className="checkout-payment__option-desc">
                    Visa, Mastercard, American Express (simulada)
                  </span>
                </span>
              </label>

              <label
                className={`checkout-payment__option ${
                  paymentMethod === 'pse' ? 'checkout-payment__option--selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="pse"
                  checked={paymentMethod === 'pse'}
                  onChange={() => setPaymentMethod('pse')}
                  disabled={isLoading}
                />
                <Landmark size={22} aria-hidden="true" className="checkout-payment__icon" />
                <span>
                  <span className="checkout-payment__option-title">PSE Demo</span>
                  <span className="checkout-payment__option-desc">
                    Débito desde tu banco en línea (simulado)
                  </span>
                </span>
              </label>
            </div>

            <p className="checkout-payment__demo-note">
              <ShieldCheck size={18} aria-hidden="true" />
              ✨ Modo Demostración — No se cobrará dinero real.
            </p>
          </section>
        </div>

        {/* ---------- Columna derecha: resumen ---------- */}
        <aside className="checkout-summary" aria-label="Resumen del pedido">
          <h2 className="checkout-summary__title">Resumen del pedido</h2>

          <div className="checkout-summary__items">
            {state.items.map((item) => (
              <div key={item.productId} className="checkout-summary__item">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="checkout-summary__item-image"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = BRAND.defaultProductImage;
                  }}
                />
                <div>
                  <div className="checkout-summary__item-name">{item.name}</div>
                  <div className="checkout-summary__item-qty">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                  </div>
                </div>
                <span className="checkout-summary__item-price">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="checkout-summary__row">
            <span>Subtotal (sin IVA)</span>
            <span>{formatCurrency(subtotalSinIva)}</span>
          </div>
          <div className="checkout-summary__row">
            <span>IVA (19%)</span>
            <span>{formatCurrency(ivaTotal)}</span>
          </div>
          <div className="checkout-summary__row">
            <span>Envío</span>
            {shippingCost === 0 ? (
              <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>Gratis</span>
            ) : (
              <span>{formatCurrency(shippingCost)}</span>
            )}
          </div>
          <div className="checkout-summary__row checkout-summary__row--total">
            <span>Total a pagar</span>
            <span>{formatCurrency(totalAPagar)}</span>
          </div>

          {/* El botón pertenece al formulario de envío (form="checkout-form") desde la columna lateral */}
          <Button
            type="submit"
            form="checkout-form"
            variant="primary"
            size="lg"
            className="checkout-summary__submit"
            isLoading={isLoading}
            disabled={isFormIncomplete}
          >
            {isLoading ? 'Procesando pago...' : `Confirmar y Pagar ${formatCurrency(totalAPagar)}`}
          </Button>
          <p className="checkout-summary__secure-note">
            {isFormIncomplete
              ? 'Completa los campos de envío para habilitar la compra.'
              : 'Al confirmar, tu stock quedará reservado para este pedido.'}
          </p>
        </aside>
      </div>
    </div>
  );
};
