import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ShieldCheck, Truck, Sparkles, Plus, Minus, ShoppingBag } from 'lucide-react';
import { ProductDetail } from '@/types/catalog';
import { fetchProductBySlug } from '@/lib/api/catalog';
import { formatCurrency } from '@/lib/formatting/currency';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import './ProductDetailPage.css';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedMessage, setAddedMessage] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    setAddedMessage(false);

    fetchProductBySlug(slug)
      .then((data) => {
        setProduct(data);
        setQuantity(1);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error al cargar el producto.';
        setError(msg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug]);

  const handleIncrement = () => {
    if (product && quantity < product.availableStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 4000);
  };

  if (isLoading) {
    return (
      <div className="container product-detail-page">
        <Skeleton width="180px" height="24px" style={{ marginBottom: '24px' }} />
        <div className="product-detail-layout">
          <Skeleton height="450px" borderRadius="var(--radius-lg)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Skeleton width="30%" height="20px" />
            <Skeleton width="90%" height="36px" />
            <Skeleton width="40%" height="32px" />
            <Skeleton width="100%" height="120px" />
            <Skeleton width="50%" height="48px" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container product-detail-page">
        <Link to="/catalogo" className="product-detail__back-link">
          <ArrowLeft size={16} /> Volver al catálogo
        </Link>
        <Alert variant="error" title="No se pudo cargar el producto">
          <p>{error || 'El producto no fue encontrado.'}</p>
          <Link to="/catalogo" style={{ marginTop: 'var(--space-2)', display: 'inline-block' }}>
            <Button variant="outline" size="sm">Explorar otros productos</Button>
          </Link>
        </Alert>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Migas de pan / Regreso */}
        <nav aria-label="Ruta de navegación" className="product-detail__breadcrumbs">
          <Link to="/catalogo" className="product-detail__back-link">
            <ArrowLeft size={16} aria-hidden="true" /> Volver al catálogo
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-category">{product.categoryName}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current" aria-current="page">{product.name}</span>
        </nav>

        {/* Layout principal */}
        <div className="product-detail-layout">
          {/* Galería / Imagen */}
          <div className="product-detail__media">
            <div className="product-detail__image-box">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="product-detail__image"
              />
              {product.hasDiscount && product.discountPercentage && (
                <Badge variant="danger" className="product-detail__badge">
                  Ahorro del {product.discountPercentage}%
                </Badge>
              )}
            </div>
          </div>

          {/* Información y Compra */}
          <div className="product-detail__info">
            <span className="product-detail__category">{product.categoryName}</span>
            <h1 className="product-detail__title">{product.name}</h1>
            <span className="product-detail__sku">SKU: {product.sku}</span>

            {/* Precios e Impuestos Transparentes */}
            <div className="product-detail__pricing-box">
              <div className="product-detail__price-row">
                <span className="product-detail__price">{formatCurrency(product.price)}</span>
                {product.hasDiscount && product.compareAtPrice && (
                  <span className="product-detail__compare-price">
                    {formatCurrency(product.compareAtPrice)}
                  </span>
                )}
              </div>
              <div className="product-detail__vat-breakdown">
                <span className="vat-badge">IVA del 19% incluido</span>
                <span className="vat-detail">
                  (Precio base: {formatCurrency(product.netBasePrice)} + IVA: {formatCurrency(product.vatAmount)})
                </span>
              </div>
            </div>

            {/* Estado de Existencias */}
            <div className="product-detail__stock-box">
              {product.inStock ? (
                <div className="stock-indicator in-stock">
                  <CheckCircle size={18} aria-hidden="true" />
                  <span>En existencias ({product.availableStock} disponibles para envío inmediato)</span>
                </div>
              ) : (
                <div className="stock-indicator out-of-stock">
                  <span>Temporalmente agotado</span>
                </div>
              )}
            </div>

            {/* Descripción */}
            <div className="product-detail__description">
              <h3>Descripción & Beneficios</h3>
              <p>{product.description}</p>
            </div>

            {/* Selector de Cantidad y Botón de Compra */}
            {product.inStock && (
              <div className="product-detail__actions">
                <div className="quantity-selector" role="group" aria-label="Cantidad de unidades">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    aria-label="Disminuir cantidad"
                    className="quantity-btn"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="quantity-display" aria-live="polite" aria-atomic="true">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={quantity >= product.availableStock}
                    aria-label="Aumentar cantidad"
                    className="quantity-btn"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAddToCart}
                  leftIcon={<ShoppingBag size={20} />}
                  className="product-detail__add-btn"
                >
                  Agregar a la bolsa
                </Button>
              </div>
            )}

            {/* Mensaje de confirmación temporal */}
            {addedMessage && (
              <Alert variant="success" style={{ marginTop: 'var(--space-4)' }}>
                ✨ <strong>¡Producto añadido!</strong> Se agregaron {quantity} unidad(es) de "{product.name}" a tu bolsa.
              </Alert>
            )}

            {/* Garantías de Marca Lúmina */}
            <div className="product-detail__guarantees">
              <div className="guarantee-item">
                <Sparkles size={18} aria-hidden="true" />
                <span>Fórmula testeada dermatológicamente y libre de crueldad.</span>
              </div>
              <div className="guarantee-item">
                <Truck size={18} aria-hidden="true" />
                <span>Empaque protector reciclable y despacho cuidadoso.</span>
              </div>
              <div className="guarantee-item">
                <ShieldCheck size={18} aria-hidden="true" />
                <span>Garantía de originalidad y compra protegida.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
