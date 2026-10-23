import React from 'react';
import { Link } from 'react-router-dom';
import { ProductSummary } from '@/types/catalog';
import { formatCurrency } from '@/lib/formatting/currency';
import { BRAND } from '@/config/brand';
import { Badge } from '@/components/ui/Badge';
import './ProductCard.css';

export interface ProductCardProps {
  product: ProductSummary;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <article className="product-card" aria-label={`Producto: ${product.name}`}>
      <Link to={`/producto/${product.slug}`} className="product-card__image-link">
        <div className="product-card__image-wrapper">
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="product-card__image"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = BRAND.defaultProductImage;
            }}
          />
          <div className="product-card__badges">
            {product.hasDiscount && product.discountPercentage && (
              <Badge variant="danger" className="product-card__badge">
                -{product.discountPercentage}%
              </Badge>
            )}
            {!product.inStock && (
              <Badge variant="default" className="product-card__badge">
                Agotado
              </Badge>
            )}
          </div>
        </div>
      </Link>

      <div className="product-card__body">
        <span className="product-card__category">{product.categoryName}</span>
        <h3 className="product-card__title">
          <Link to={`/producto/${product.slug}`} className="product-card__title-link">
            {product.name}
          </Link>
        </h3>

        <div className="product-card__pricing">
          <span className="product-card__price">{formatCurrency(product.price)}</span>
          {product.hasDiscount && product.compareAtPrice && (
            <span className="product-card__compare-price">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>

        <div className="product-card__footer">
          <span className={`product-card__stock-status ${product.inStock ? 'is-in-stock' : 'is-out-of-stock'}`}>
            {product.inStock ? '• En stock' : '• Sin existencias'}
          </span>
          <Link to={`/producto/${product.slug}`} className="product-card__view-btn">
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  );
};
