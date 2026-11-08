import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  ClipboardList,
  Package,
  PackageMinus,
  Pencil,
  Plus,
  ShoppingCart,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  adjustAdminInventory,
  createAdminProduct,
  getAdminInventory,
  getAdminOrders,
  getAdminProducts,
  toggleAdminProductStatus,
  updateAdminOrderStatus,
  updateAdminProduct,
} from '@/lib/api/admin';
import { fetchCategories } from '@/lib/api/catalog';
import { BRAND } from '@/config/brand';
import { formatCurrency } from '@/lib/formatting/currency';
import type {
  AdminInventoryItem,
  AdminOrderStatus,
  AdminOrderSummary,
  AdminProduct,
} from '@/types/admin';
import type { Category } from '@/types/catalog';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import './admin.css';

interface AdminFeedback {
  type: 'success' | 'error';
  message: string;
}

type OrdersTabFilter = 'ALL' | AdminOrderStatus;
type ActiveTab = 'orders' | 'inventory' | 'products';
/** Modal de producto: creación o edición con el producto pre-cargado. */
type ProductModal = { mode: 'create' } | { mode: 'edit'; product: AdminProduct } | null;

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

/** Convierte un campo de monto/stock a número; NaN si no es parseable. */
function parseNumericField(raw: string): number {
  if (raw.trim() === '') {
    return Number.NaN;
  }
  return Number(raw.replace(',', '.'));
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
 * Pestañas: Pedidos (estados), Inventario (ajustes) y Productos (CRUD
 * comercial con soft delete por INVIMA/descontinuación — nunca DELETE físico).
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

  // Productos (Fase 5C): listado + categorías del selector + modales
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [togglingProductId, setTogglingProductId] = useState<number | null>(null);
  const [productModal, setProductModal] = useState<ProductModal>(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productModalError, setProductModalError] = useState<string | null>(null);

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

  // Carga de productos del catálogo (activos e inactivos)
  useEffect(() => {
    if (!token) {
      setProductsLoading(false);
      return;
    }
    let cancelled = false;
    setProductsLoading(true);
    setProductsError(null);

    getAdminProducts(token)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setProductsError(
            err instanceof Error ? err.message : 'Error inesperado al cargar los productos.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Categorías para el selector de los modales de producto
  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        // El selector queda vacío; no rompe el flujo de gestión de productos
        if (!cancelled) setCategories(null);
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

  // ================= Productos (Fase 5C) =================

  // Campos del formulario del modal de producto (strings = inputs sin control)
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCompareAtPrice, setFormCompareAtPrice] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formInitialStock, setFormInitialStock] = useState('');

  const openCreateProductModal = useCallback(() => {
    setFormName('');
    setFormSku('');
    setFormCategoryId('');
    setFormPrice('');
    setFormCompareAtPrice('');
    setFormImageUrl('');
    setFormDescription('');
    setFormInitialStock('');
    setProductModalError(null);
    setProductModal({ mode: 'create' });
  }, []);

  const openEditProductModal = useCallback((product: AdminProduct) => {
    setFormName(product.name);
    setFormCategoryId(String(product.categoryId));
    setFormPrice(String(product.price));
    setFormCompareAtPrice(product.compareAtPrice != null ? String(product.compareAtPrice) : '');
    setFormImageUrl(product.imageUrl ?? '');
    setFormDescription('');
    setProductModalError(null);
    // description no viene en AdminProductResponse (DTO del backend); en edición
    // se envía la que el admin escriba aquí o se limpia si deja vacío
    setProductModal({ mode: 'edit', product });
  }, []);

  const closeProductModal = useCallback(() => {
    setProductModal(null);
    setProductModalError(null);
  }, []);

  const parsedFormPrice = parseNumericField(formPrice);
  const parsedFormCompareAt = parseNumericField(formCompareAtPrice);
  const isPriceValid = Number.isFinite(parsedFormPrice) && parsedFormPrice >= 0;
  const isCompareAtValid =
    formCompareAtPrice.trim() === '' ||
    (Number.isFinite(parsedFormCompareAt) && parsedFormCompareAt >= 0);
  const parsedInitialStock = Number.isInteger(parseNumericField(formInitialStock))
    ? parseNumericField(formInitialStock)
    : Number.NaN;
  const isInitialStockValid =
    formInitialStock.trim() === '' ||
    (Number.isFinite(parsedInitialStock) && parsedInitialStock >= 0);

  // Validación en vivo: el submit se inhabilita si falta un campo obligatorio
  const isProductFormValid =
    formName.trim().length > 0 &&
    productModal !== null &&
    (productModal.mode === 'create' ? formSku.trim().length > 0 : true) &&
    formCategoryId !== '' &&
    isPriceValid &&
    isCompareAtValid &&
    (productModal.mode === 'create' ? isInitialStockValid : true);

  // Crear o editar producto desde el modal; atualiza la tabla en vivo
  const handleProductSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (!token || productModal === null || !isProductFormValid || productSubmitting) {
        return;
      }

      const basePayload = {
        name: formName.trim(),
        categoryId: Number(formCategoryId),
        price: parsedFormPrice,
        compareAtPrice:
          formCompareAtPrice.trim() === '' ? undefined : parsedFormCompareAt,
        imageUrl: formImageUrl.trim() === '' ? undefined : formImageUrl.trim(),
        description: formDescription.trim() === '' ? undefined : formDescription.trim(),
      };

      setProductSubmitting(true);
      setProductModalError(null);
      setFeedback(null);

      if (productModal.mode === 'create') {
        const payload = {
          ...basePayload,
          sku: formSku.trim(),
          initialStock: Number.isFinite(parsedInitialStock) ? parsedInitialStock : 0,
        };
        createAdminProduct(token, payload)
          .then((created) => {
            // El producto más nuevo encabeza la tabla (mismo orden id DESC del backend)
            setProducts((prev) => [created, ...(prev ?? [])]);
            setFeedback({
              type: 'success',
              message: `Producto "${created.name}" creado con ${created.availableQuantity} unidades en inventario.`,
            });
            closeProductModal();
          })
          .catch((err: unknown) => {
            // El modal queda abierto para corregir (ej. SKU duplicado → 409)
            setProductModalError(
              err instanceof Error ? err.message : 'Error inesperado al crear el producto.'
            );
          })
          .finally(() => {
            setProductSubmitting(false);
          });
      } else {
        const payload = { ...basePayload };
        updateAdminProduct(token, productModal.product.id, payload)
          .then((updated) => {
            setProducts((prev) =>
              prev?.map((product) =>
                product.id === updated.id ? updated : product
              ) ?? prev
            );
            setFeedback({
              type: 'success',
              message: `Producto "${updated.name}" actualizado correctamente.`,
            });
            closeProductModal();
          })
          .catch((err: unknown) => {
            setProductModalError(
              err instanceof Error ? err.message : 'Error inesperado al actualizar el producto.'
            );
          })
          .finally(() => {
            setProductSubmitting(false);
          });
      }
    },
    [
      token,
      productModal,
      isProductFormValid,
      productSubmitting,
      formName,
      formSku,
      formCategoryId,
      parsedFormPrice,
      formCompareAtPrice,
      parsedFormCompareAt,
      formImageUrl,
      formDescription,
      parsedInitialStock,
      closeProductModal,
    ]
  );

  // Soft delete en vivo (INVIMA/descontinuación): invierte is_active
  const handleToggleProduct = useCallback(
    (product: AdminProduct) => {
      if (!token) {
        return;
      }
      setTogglingProductId(product.id);
      setFeedback(null);
      setProductsError(null);

      toggleAdminProductStatus(token, product.id)
        .then((updated) => {
          setProducts((prev) =>
            prev?.map((item) => (item.id === updated.id ? updated : item)) ?? prev
          );
          setFeedback({
            type: 'success',
            message: updated.active
              ? `Producto "${updated.name}" reactivado (visible en el catálogo público).`
              : `Producto "${updated.name}" desactivado (oculto del catálogo público por INVIMA/descontinuación).`,
          });
        })
        .catch((err: unknown) => {
          setProductsError(
            err instanceof Error
              ? err.message
              : 'Error inesperado al cambiar el estado del producto.'
          );
          setFeedback(null);
        })
        .finally(() => {
          setTogglingProductId(null);
        });
    },
    [token]
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
          Gestión de pedidos, estados del ciclo de vida e inventario y productos de la tienda.
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
          Pedidos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'inventory'}
          className={`admin-tab ${activeTab === 'inventory' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Boxes size={18} aria-hidden="true" />
          Inventario
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'products'}
          className={`admin-tab ${activeTab === 'products' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={18} aria-hidden="true" />
          Productos
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

      {/* ================= Pestaña 3: Gestión de Productos (Fase 5C) ================= */}
      {activeTab === 'products' && (
        <section aria-label="Gestión de productos">
          <div className="admin-products-header">
            <p className="admin-products-count">
              {products ? `${products.length} productos registrados (activos e inactivos)` : ''}
            </p>
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={openCreateProductModal}
            >
              + Nuevo Producto
            </Button>
          </div>

          {productsError && (
            <Alert
              variant="error"
              title="No pudimos cargar los productos"
              style={{ marginBottom: 'var(--space-5)' }}
            >
              {productsError}
            </Alert>
          )}

          {productsLoading ? (
            <p role="status" aria-live="polite">
              Cargando productos...
            </p>
          ) : products && products.length === 0 ? (
            <div className="admin-table-wrap">
              <p className="admin-empty">No hay productos en el catálogo todavía.</p>
            </div>
          ) : products && products.length > 0 ? (
            <div className="admin-table-wrap admin-products-list">
              <table className="admin-table">
                <caption style={srOnlyStyle}>Productos del catálogo</caption>
                <thead>
                  <tr>
                    <th scope="col" aria-label="Foto" />
                    <th scope="col">Producto</th>
                    <th scope="col">Categoría</th>
                    <th scope="col" className="admin-cell--num">Precio</th>
                    <th scope="col" className="admin-cell--num">Stock Disponible</th>
                    <th scope="col">Estado</th>
                    <th scope="col" aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <img
                          src={product.imageUrl || BRAND.defaultProductImage}
                          alt={`Foto de ${product.name}`}
                          className="admin-product-thumb"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = BRAND.defaultProductImage;
                          }}
                        />
                      </td>
                      <td>
                        {product.name}
                        <div className="admin-cell__sku">{product.sku}</div>
                      </td>
                      <td>{product.categoryName}</td>
                      <td className="admin-cell--num">{formatCurrency(product.price)}</td>
                      <td className="admin-cell--num">{product.availableQuantity}</td>
                      <td>
                        {/* Soft delete en vivo: invierte is_active (nunca hay borrado físico) */}
                        <button
                          type="button"
                          className={`admin-status-toggle ${product.active ? 'admin-status-toggle--active' : 'admin-status-toggle--inactive'}`}
                          disabled={togglingProductId !== null}
                          onClick={() => handleToggleProduct(product)}
                          aria-label={
                            product.active
                              ? `Desactivar ${product.name} (ocultar del catálogo público)`
                              : `Reactivar ${product.name} en el catálogo público`
                          }
                        >
                          {product.active ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Pencil size={14} />}
                          onClick={() => openEditProductModal(product)}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
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

      {/* ================= Modal de producto: crear / editar (Fase 5C) ================= */}
      {productModal && (
        <div
          className="admin-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeProductModal();
            }
          }}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <h2 id="product-modal-title" className="admin-modal__title">
              {productModal.mode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
            </h2>
            <p className="admin-modal__subtitle">
              {productModal.mode === 'create'
                ? 'El backend generará el slug desde el nombre y creará el inventario inicial.'
                : `SKU ${productModal.product.sku} · El slug y el SKU no son editables.`}
            </p>

            {productModalError && (
              <Alert variant="error" style={{ marginTop: 'var(--space-4)' }}>
                {productModalError}
              </Alert>
            )}

            <form onSubmit={handleProductSubmit}>
              <div className="admin-field">
                <label htmlFor="product-name">Nombre *</label>
                <input
                  id="product-name"
                  className="admin-input"
                  type="text"
                  maxLength={150}
                  placeholder="Ej.: Sérum Facial Rosa Mosqueta"
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  autoFocus
                />
              </div>

              {productModal.mode === 'create' && (
                <div className="admin-field">
                  <label htmlFor="product-sku">SKU *</label>
                  <input
                    id="product-sku"
                    className="admin-input"
                    type="text"
                    maxLength={50}
                    placeholder="Ej.: LUM-FAC-NEW"
                    value={formSku}
                    onChange={(event) => setFormSku(event.target.value)}
                  />
                  <p className="admin-hint">Debe ser único; el backend responde 409 si ya existe.</p>
                </div>
              )}

              <div className="admin-field">
                <label htmlFor="product-category">Categoría *</label>
                <select
                  id="product-category"
                  className="admin-input"
                  value={formCategoryId}
                  onChange={(event) => setFormCategoryId(event.target.value)}
                >
                  <option value="">Selecciona una categoría</option>
                  {(categories ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-field">
                <label htmlFor="product-price">Precio (COP) *</label>
                <input
                  id="product-price"
                  className="admin-input"
                  type="number"
                  step="100"
                  min="0"
                  placeholder="Ej.: 49900"
                  value={formPrice}
                  onChange={(event) => setFormPrice(event.target.value)}
                />
              </div>

              <div className="admin-field">
                <label htmlFor="product-compare">Precio de comparación (opcional)</label>
                <input
                  id="product-compare"
                  className="admin-input"
                  type="number"
                  step="100"
                  min="0"
                  placeholder="Ej.: 62000 (mayor o igual al precio)"
                  value={formCompareAtPrice}
                  onChange={(event) => setFormCompareAtPrice(event.target.value)}
                />
              </div>

              <div className="admin-field">
                <label htmlFor="product-image">URL de imagen (opcional)</label>
                <input
                  id="product-image"
                  className="admin-input"
                  type="text"
                  placeholder="https://..."
                  value={formImageUrl}
                  onChange={(event) => setFormImageUrl(event.target.value)}
                />
              </div>

              <div className="admin-field">
                <label htmlFor="product-description">Descripción (opcional)</label>
                <textarea
                  id="product-description"
                  className="admin-input"
                  placeholder="Descripción comercial del producto"
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                  maxLength={2000}
                />
              </div>

              {productModal.mode === 'create' && (
                <div className="admin-field">
                  <label htmlFor="product-stock">Stock inicial</label>
                  <input
                    id="product-stock"
                    className="admin-input"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Ej.: 10 (0 si es solo catálogo)"
                    value={formInitialStock}
                    onChange={(event) => setFormInitialStock(event.target.value)}
                  />
                  <p className="admin-hint">
                    Se creará una fila de inventario; si es &gt; 0 el movimiento queda auditado.
                  </p>
                </div>
              )}

              <div className="admin-modal__actions">
                <Button variant="ghost" onClick={closeProductModal} type="button">
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={productSubmitting}
                  disabled={!isProductFormValid}
                  leftIcon={<Plus size={16} />}
                >
                  {productModal.mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
