import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Mail, Printer } from 'lucide-react';
import { getOrderByNumber } from '@/lib/api/orders';
import { formatCurrency } from '@/lib/formatting/currency';
import type { OrderResponse } from '@/types/orders';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { BRAND } from '@/config/brand';
import './orderConfirmation.css';

/** Traduce el status del backend a etiqueta y variante de badge. */
function statusBadge(status: string): { label: string; variant: 'success' | 'warning' | 'danger' } {
  switch (status) {
    case 'PAID':
      return { label: 'Pago confirmado', variant: 'success' };
    case 'CANCELLED':
      return { label: 'Pedido cancelado', variant: 'danger' };
    default:
      return { label: 'Pago pendiente (demo)', variant: 'warning' };
  }
}

/**
 * Comprobante de compra (/pedido/confirmacion/:orderNumber).
 * Carga la orden por número desde el backend y presenta una factura
 * imprimible (window.print() con @media print limpio).
 */
export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) {
      setError('Número de pedido no especificado.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getOrderByNumber(orderNumber)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error inesperado al cargar el pedido.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  if (isLoading) {
    return (
      <div className="container confirmation-page">
        <p className="confirmation-loading" role="status" aria-live="polite">
          Cargando el comprobante de tu pedido...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container confirmation-page">
        <Alert variant="error" title="No pudimos cargar tu pedido">
          {error ?? 'El pedido no está disponible.'}{' '}
          Si el problema continúa, contáctanos con el número de pedido exacto.
        </Alert>
        <div className="confirmation-actions">
          <Link to="/catalogo" className="confirmation-actions__link">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const firstName = order.customerName.split(' ')[0];
  const badge = statusBadge(order.status);

  return (
    <div className="container confirmation-page">
      <article className="confirmation-card" aria-labelledby="confirmation-title">
        {/* ---------- Encabezado de agradecimiento ---------- */}
        <header className="confirmation-card__hero">
          <CheckCircle2 size={56} className="confirmation-card__success-icon" aria-hidden="true" />
          <h1 id="confirmation-title" className="confirmation-card__title">
            ¡Gracias por tu compra, {firstName}!
          </h1>
          <div className="confirmation-card__status">
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="confirmation-card__order-number">{order.orderNumber}</p>
        </header>

        {/* Notificación requerida por el Product Owner */}
        <p className="confirmation-email-notice">
          <Mail size={18} aria-hidden="true" />
          <span>
            📧 Hemos enviado los detalles y el comprobante de tu pedido a{' '}
            <strong>{order.customerEmail}</strong>.
          </span>
        </p>

        {/* ---------- Factura imprimible ---------- */}
        <section className="confirmation-invoice" aria-label="Comprobante de compra">
          <div className="confirmation-invoice__header">
            <span className="confirmation-invoice__brand">{BRAND.name}</span>
            <span className="confirmation-invoice__label">Comprobante de compra</span>
          </div>

          <div className="confirmation-invoice__meta">
            <div>
              <strong>Cliente:</strong> {order.customerName}
            </div>
            <div>
              <strong>Dirección de entrega:</strong> {order.shippingAddress}, {order.shippingCity}
              {order.shippingDepartment ? `, ${order.shippingDepartment}` : ''}
            </div>
            <div>
              <strong>Fecha:</strong>{' '}
              {new Date(order.createdAt).toLocaleString(BRAND.currency.locale)}
            </div>
          </div>

          <table className="confirmation-table">
            <caption>Productos comprados</caption>
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Cant.</th>
                <th scope="col">Precio</th>
                <th scope="col">Importe</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.productId}>
                  <td>
                    {item.productName}
                    <br />
                    <small>SKU: {item.productSku}</small>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="confirmation-totals">
            <div className="confirmation-totals__row">
              <span>Subtotal (sin IVA)</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="confirmation-totals__row">
              <span>IVA (19%)</span>
              <span>{formatCurrency(order.vatTotal)}</span>
            </div>
            <div className="confirmation-totals__row">
              <span>Envío</span>
              <span>
                {order.shippingCost === 0
                  ? 'Gratis'
                  : formatCurrency(order.shippingCost)}
              </span>
            </div>
            <div className="confirmation-totals__row confirmation-totals__row--grand">
              <span>Total pagado</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </section>

        {/* ---------- Acciones (ocultas al imprimir) ---------- */}
        <div className="confirmation-actions no-print">
          <Button
            variant="primary"
            size="lg"
            className="confirmation-actions__primary"
            leftIcon={<Printer size={18} />}
            onClick={() => window.print()}
          >
            Descargar / Imprimir Comprobante
          </Button>
          <Link to="/catalogo" className="confirmation-actions__link">
            Volver al catálogo
          </Link>
        </div>
      </article>
    </div>
  );
};
