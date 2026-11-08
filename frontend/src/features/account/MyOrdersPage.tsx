import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Package, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { getMyOrders } from '@/lib/api/orders';
import { formatCurrency } from '@/lib/formatting/currency';
import type { OrderSummary } from '@/types/orders';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import './myOrders.css';

/** Traduce el status del backend a etiqueta y color de badge para el historial. */
function orderStatusBadge(status: string): { label: string; variant: 'success' | 'warning' | 'danger' } {
  switch (status) {
    case 'PAID':
      return { label: 'Pago confirmado', variant: 'success' };
    case 'CANCELLED':
      return { label: 'Cancelado', variant: 'danger' };
    default:
      return { label: 'Pago pendiente', variant: 'warning' };
  }
}

/**
 * Historial de pedidos del cliente autenticado (/cuenta/pedidos).
 * Protegida: si no hay sesión, redirige al ingreso.
 */
export const MyOrdersPage: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      // Sin sesión no hay historial que pedir; el guard de render redirigirá
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getMyOrders(token)
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error inesperado al cargar tu historial.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Protección de ruta: solo usuarios autenticados ven su historial
  if (!isAuthenticated) {
    return <Navigate to="/cuenta/ingreso" replace />;
  }

  if (isLoading) {
    return (
      <div className="container my-orders-page">
        <p className="my-orders-loading" role="status" aria-live="polite">
          Cargando tus pedidos...
        </p>
      </div>
    );
  }

  return (
    <div className="container my-orders-page">
      <header className="my-orders-page__header">
        <h1 className="my-orders-page__title">Mis Pedidos</h1>
        <p className="my-orders-page__subtitle">
          Consulta aquí todo el historial de tus compras en Lúmina.
        </p>
      </header>

      {error && (
        <Alert variant="error" title="No pudimos cargar tu historial" style={{ marginBottom: 'var(--space-6)' }}>
          {error}
        </Alert>
      )}

      {!error && orders && orders.length === 0 && (
        <div className="my-orders-empty">
          <Package size={56} className="my-orders-empty__icon" aria-hidden="true" />
          <h2 className="my-orders-empty__title">Aún no tienes pedidos</h2>
          <p className="my-orders-empty__text">
            Cuando realices tu primera compra, aquí encontrarás el historial
            con todos tus comprobantes.
          </p>
          <div className="my-orders-empty__actions">
            <Link to="/catalogo">
              <Button variant="primary" leftIcon={<ShoppingBag size={18} />}>
                Explorar el catálogo
              </Button>
            </Link>
          </div>
        </div>
      )}

      {!error && orders && orders.length > 0 && (
        <div className="my-orders-list" role="list" aria-label="Historial de pedidos">
          {orders.map((order) => {
            const badge = orderStatusBadge(order.status);
            return (
              <article key={order.id} className="my-order-card" role="listitem">
                <div className="my-order-card__info">
                  <span className="my-order-card__number">{order.orderNumber}</span>
                  <p className="my-order-card__date">
                    {new Date(order.createdAt).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <div className="my-order-card__status">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                </div>

                <div className="my-order-card__summary">
                  <span className="my-order-card__total">{formatCurrency(order.totalAmount)}</span>
                  <p className="my-order-card__units">
                    {order.itemsCount} {order.itemsCount === 1 ? 'producto' : 'productos'}
                  </p>
                </div>

                <div className="my-order-card__action">
                  <Link to={`/pedido/confirmacion/${order.orderNumber}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      rightIcon={<ArrowRight size={16} />}
                    >
                      Ver Comprobante
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
