import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  ClipboardList,
  PackageMinus,
  ShoppingCart,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  adjustAdminInventory,
  getAdminInventory,
  getAdminOrders,
  updateAdminOrderStatus,
} from '@/lib/api/admin';
import { formatCurrency } from '@/lib/formatting/currency';
import type {
  AdminInventoryItem,
  AdminOrderStatus,
  AdminOrderSummary,
} from '@/types/admin';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import './admin.css';

interface AdminFeedback {
  type: 'success' | 'error';
  message: string;
}

type OrdersTabFilter = 'ALL' | AdminOrderStatus;
type ActiveTab = 'orders' | 'inventory';

/** Etiquetas legibles para el selector y los badges de estado del pedido. */
const ORDER_STATUS_LABELS: Record<AdminOrderStatus, string> = {
  PENDING_PAYMENT: 'Pago pendiente',
  PAID: 'Pago confirmado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

/** Filtros rápidos de la pestaña de pedidos (TODOS + 5 estados). */
const ORDER_FILTERS: { value: OrdersTabFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING_PAYMENT', label: ORDER_STATUS_LABELS.PENDING_PAYMENT },
  { value: 'PAID', label: ORDER_STATUS_LABELS.PAID },
  { value: 'SHIPPED', label: ORDER_STATUS_LABELS.SHIPPED },
  { value: 'DELIVERED', label: ORDER_STATUS_LABELS.DELIVERED },
  { value: 'CANCELLED', label: ORDER_STATUS_LABELS.CANCELLED },
];

/** Opciones del select de cambio de estado por fila. */
const STATUS_SELECT_OPTIONS: AdminOrderStatus[] = [
  'PENDING_PAYMENT',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

/** Bandera de stock: Agotado (rojo), Stock bajo (amarillo) o En stock (verde). */
function stockLevel(item: AdminInventoryItem): {
  label: string;
  variant: 'success' | 'warning' | 'danger';
} {
  if (item.availableQuantity === 0) {
    return { label: 'Agotado', variant: 'danger' };
  }
  if (item.availableQuantity <= item.minStockAlert) {
    return { label: 'Stock bajo', variant: 'warning' };
  }
  return { label: 'En stock', variant: 'success' };
}

/** Fecha legible con formato es-CO (mismo patrón de MyOrdersPage). */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Estilo para ocultar visualmente el caption de la tabla (accesible). */
const srOnlyStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * Panel de administración del backoffice (/admin), exclusivo de ROLE_ADMIN.
 * El backend protege /api/admin/** con hasRole("ADMIN"); este guard frontal
 * solo decide presentación (lo sensible nunca depende del frontend).
 */
export const AdminPage: React.FC = () => {
  const { token, user, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');
  const [statusFilter, setStatusFilter] = useState<OrdersTabFilter>('ALL');

  const [orders, setOrders] = useState<AdminOrderSummary[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [updatingOrderNumber, setUpdatingOrderNumber] = useState<string | null>(null);

  const [inventory, setInventory] = useState<AdminInventoryItem[] | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // Ajuste de inventario: fila objetivo + campos del formulario del modal
  const [adjustTarget, setAdjustTarget] = useState<AdminInventoryItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);

  const isAdmin = isAuthenticated && user?.role === 'ROLE_ADMIN';

  // Carga de pedidos (se re-consulta con ?status= al cambiar el filtro rápido)
  useEffect(() => {
    if (!token) {
      setOrdersLoading(false);
      return;
    }
    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError(null);

    getAdminOrders(token, statusFilter === 'ALL' ? undefined : statusFilter)
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setOrdersError(
            err instanceof Error ? err.message : 'Error inesperado al cargar los pedidos.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, statusFilter]);

  // Carga del inventario
  useEffect(() => {
    if (!token) {
      setInventoryLoading(false);
      return;
    }
    let cancelled = false;
    setInventoryLoading(true);
    setInventoryError(null);

    getAdminInventory(token)
      .then((data) => {
        if (!cancelled) setInventory(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setInventoryError(
            err instanceof Error ? err.message : 'Error inesperado al cargar el inventario.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setInventoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // El mensaje de éxito se descarta solo tras unos segundos
  useEffect(() => {
    if (feedback?.type !== 'success') {
      return;
    }
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Transición de estado de una orden desde la fila (ej. PAID → SHIPPED)
  const handleStatusChange = useCallback(
    (orderNumber: string, newStatus: AdminOrderStatus) => {
      if (!token) {
        return;
      }
      setUpdatingOrderNumber(orderNumber);
      setFeedback(null);
      setOrdersError(null);

      updateAdminOrderStatus(token, orderNumber, newStatus)
        .then((updated) => {
          // El backend recalcula y persiste; reemplazamos la fila sin refetch
          setOrders((prev) =>
            prev?.map((order) =>
              order.orderNumber === orderNumber
                ? { ...order, status: updated.status as AdminOrderStatus }
                : order
            ) ?? prev
          );
          setFeedback({
            type: 'success',
            message: `Pedido ${orderNumber} actualizado a "${ORDER_STATUS_LABELS[newStatus]}".`,
          });
        })
        .catch((err: unknown) => {
          // El select sigue controlado por order.status, que no cambió:
          // se restaura solo al re-renderizar sin tocar la lista
          setOrdersError(
            err instanceof Error
              ? err.message
              : 'Error inesperado al actualizar el estado del pedido.'
          );
          setFeedback(null);
        })
        .finally(() => {
          setUpdatingOrderNumber(null);
        });
    },
    [token]
  );

  const openAdjustModal = useCallback((item: AdminInventoryItem) => {
    setAdjustTarget(item);
    setAdjustDelta('');
    setAdjustReason('');
  }, []);

  const closeAdjustModal = useCallback(() => {
    setAdjustTarget(null);
    setAdjustDelta('');
    setAdjustReason('');
  }, []);

  const parsedDelta = Number(adjustDelta.replace(',', '.'));
  const isAdjustValid =
    adjustDelta.trim().length > 0 &&
    Number.isFinite(parsedDelta) &&
    Number.isInteger(parsedDelta) &&
    parsedDelta !== 0 &&
    adjustReason.trim().length > 0;

  // Envío del ajuste de stock (delta ≠ 0 con motivo) — actualiza la fila
  const handleAdjustSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (!token || !adjustTarget || !isAdjustValid || adjustSubmitting) {
        return;
      }
      setAdjustSubmitting(true);
      setFeedback(null);

      adjustAdminInventory(token, {
        productId: adjustTarget.productId,
        quantityDelta: parsedDelta,
        reason: adjustReason.trim(),
      })
        .then((updated) => {
          setInventory((prev) =>
            prev?.map((item) =>
              item.productId === updated.productId ? updated : item
            ) ?? prev
          );
          setFeedback({
            type: 'success',
            message: `Inventario de "${updated.productName}" ajustado: ${updated.availableQuantity} unidades disponibles.`,
          });
          closeAdjustModal();
        })
        .catch((err: unknown) => {
          setFeedback({
            type: 'error',
            message:
              err instanceof Error
                ? err.message
                : 'Error inesperado al ajustar el inventario.',
          });
          closeAdjustModal();
        })
        .finally(() => {
          setAdjustSubmitting(false);
        });
    },
    [token, adjustTarget, isAdjustValid, adjustSubmitting, parsedDelta, adjustReason, closeAdjustModal]
  );

  // Guard de ruta: solo ROLE_ADMIN entra al backoffice
  if (!isAdmin) {
    return <Navigate to="/cuenta/ingreso" replace />;
  }

  return (
    <div className="container admin-page">
      <header>
        <div className="admin-header">
          <ShieldCheck size={32} className="admin-header__icon" aria-hidden="true" />
          <h1 className="admin-title">Panel de Administración</h1>
        </div>
        <p className="admin-subtitle">
          Gestión de pedidos, estados del ciclo de vida y control de inventario de la tienda.
        </p>
      </header>

      {feedback && (
        <Alert
          variant={feedback.type === 'success' ? 'success' : 'error'}
          style={{ marginTop: 'var(--space-5)' }}
        >
          {feedback.message}
        </Alert>
      )}

      <div className="admin-tabs" role="tablist" aria-label="Secciones del panel">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'orders'}
          className={`admin-tab ${activeTab === 'orders' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ClipboardList size={18} aria-hidden="true" />
          Gestión de Pedidos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'inventory'}
          className={`admin-tab ${activeTab === 'inventory' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Boxes size={18} aria-hidden="true" />
          Control de Inventario
        </button>
      </div>

      {/* ================= Pestaña 1: Gestión de Pedidos ================= */}
      {activeTab === 'orders' && (
        <section aria-label="Gestión de pedidos">
          <div className="admin-filters" role="group" aria-label="Filtrar por estado">
            {ORDER_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`admin-filter-chip ${statusFilter === filter.value ? 'admin-filter-chip--active' : ''}`}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {ordersError && (
            <Alert
              variant="error"
              title="No pudimos cargar los pedidos"
              style={{ marginBottom: 'var(--space-5)' }}
            >
              {ordersError}
            </Alert>
          )}

          {ordersLoading ? (
            <p role="status" aria-live="polite">
              Cargando pedidos...
            </p>
          ) : orders && orders.length === 0 ? (
            <div className="admin-table-wrap">
              <p className="admin-empty">No hay pedidos registrados con este filtro.</p>
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <caption style={srOnlyStyle}>Pedidos del sistema</caption>
                <thead>
                  <tr>
                    <th scope="col">N.º Pedido</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Email</th>
                    <th scope="col">Ciudad</th>
                    <th scope="col" className="admin-cell--num">Unidades</th>
                    <th scope="col" className="admin-cell--num">Total</th>
                    <th scope="col">Estado</th>
                    <th scope="col" aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="admin-cell--mono">{order.orderNumber}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{order.customerName}</td>
                      <td>{order.customerEmail}</td>
                      <td>{order.shippingCity}</td>
                      <td className="admin-cell--num">{order.itemsCount}</td>
                      <td className="admin-cell--num">{formatCurrency(order.totalAmount)}</td>
                      <td>
                        <select
                          className="admin-status-select"
                          value={order.status}
                          disabled={updatingOrderNumber !== null}
                          onChange={(event) =>
                            handleStatusChange(order.orderNumber, event.target.value as AdminOrderStatus)
                          }
                          aria-label={`Cambiar estado del pedido ${order.orderNumber}`}
                        >
                          {STATUS_SELECT_OPTIONS.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {ORDER_STATUS_LABELS[statusOption]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <Link to={`/pedido/confirmacion/${order.orderNumber}`}>
                          <Button variant="outline" size="sm" rightIcon={<ArrowRight size={14} />}>
                            Ver Comprobante
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      )}

      {/* ================= Pestaña 2: Control de Inventario ================= */}
      {activeTab === 'inventory' && (
        <section aria-label="Control de inventario">
          {inventoryError && (
            <Alert
              variant="error"
              title="No pudimos cargar el inventario"
              style={{ marginBottom: 'var(--space-5)' }}
            >
              {inventoryError}
            </Alert>
          )}

          {inventoryLoading ? (
            <p role="status" aria-live="polite">
              Cargando inventario...
            </p>
          ) : inventory && inventory.length === 0 ? (
            <div className="admin-table-wrap">
              <p className="admin-empty">No hay productos con inventario registrado.</p>
            </div>
          ) : inventory && inventory.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">SKU</th>
                    <th scope="col">Producto</th>
                    <th scope="col">Categoría</th>
                    <th scope="col" className="admin-cell--num">Precio</th>
                    <th scope="col" className="admin-cell--num">Disponible</th>
                    <th scope="col" className="admin-cell--num">Reservado</th>
                    <th scope="col" className="admin-cell--num">Alerta Mín.</th>
                    <th scope="col">Stock</th>
                    <th scope="col" aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => {
                    const level = stockLevel(item);
                    return (
                      <tr key={item.productId}>
                        <td className="admin-cell--mono">{item.sku}</td>
                        <td>{item.productName}</td>
                        <td>{item.categoryName}</td>
                        <td className="admin-cell--num">{formatCurrency(item.price)}</td>
                        <td className="admin-cell--num">{item.availableQuantity}</td>
                        <td className="admin-cell--num">{item.reservedQuantity}</td>
                        <td className="admin-cell--num">{item.minStockAlert}</td>
                        <td>
                          <Badge variant={level.variant}>{level.label}</Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<PackageMinus size={14} />}
                            onClick={() => openAdjustModal(item)}
                          >
                            Ajustar Stock
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      )}

      {/* ================= Modal de ajuste de inventario ================= */}
      {adjustTarget && (
        <div
          className="admin-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeAdjustModal();
            }
          }}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adjust-modal-title"
          >
            <h2 id="adjust-modal-title" className="admin-modal__title">
              Ajustar Stock
            </h2>
            <p className="admin-modal__subtitle">
              {adjustTarget.productName} — SKU {adjustTarget.sku} · Disponible:{' '}
              {adjustTarget.availableQuantity} unidades.
            </p>

            <form onSubmit={handleAdjustSubmit}>
              <div className="admin-field">
                <label htmlFor="adjust-delta">Cantidad (delta)</label>
                <input
                  id="adjust-delta"
                  className="admin-input"
                  type="number"
                  step="1"
                  placeholder="Ej.: 10 para reabastecer, -2 para merma"
                  value={adjustDelta}
                  onChange={(event) => setAdjustDelta(event.target.value)}
                  aria-describedby="adjust-delta-hint"
                />
                <p className="admin-hint" id="adjust-delta-hint">
                  Positivo = entrada de unidades; negativo = salida (merma o baja).
                </p>
              </div>
              <div className="admin-field">
                <label htmlFor="adjust-reason">Motivo</label>
                <input
                  id="adjust-reason"
                  className="admin-input"
                  type="text"
                  placeholder="Ej.: Reabastecimiento de bodega"
                  value={adjustReason}
                  onChange={(event) => setAdjustReason(event.target.value)}
                  maxLength={255}
                  aria-describedby="adjust-reason-hint"
                />
                <p className="admin-hint" id="adjust-reason-hint">
                  El ajuste queda auditado con tu motivo en el historial de movimientos.
                </p>
              </div>
              <div className="admin-modal__actions">
                <Button variant="ghost" onClick={closeAdjustModal} type="button">
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={adjustSubmitting}
                  disabled={!isAdjustValid}
                  leftIcon={<ShoppingCart size={16} />}
                >
                  Aplicar Ajuste
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
