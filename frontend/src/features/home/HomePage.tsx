import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { ProductSummary } from '@/types/catalog';
import { fetchFeaturedProducts } from '@/lib/api/catalog';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts()
      .then(setFeaturedProducts)
      .catch((err) => {
        console.error('Error al cargar destacados:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero__container">
          <div className="hero__content">
            <Badge variant="accent">Colección Dermatológica & Botánica</Badge>
            <h1 className="hero__title">
              Cuidado y bienestar formulado para tu piel
            </h1>
            <p className="hero__subtitle">
              Descubre nuestra línea de cosméticos, hidratación facial e higiene corporal
              con ingredientes rigurosamente seleccionados y libres de crueldad animal.
            </p>
            <div className="hero__cta">
              <Link to="/catalogo">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
                  Explorar Catálogo Completo
                </Button>
              </Link>
              <Link to="/nosotros">
                <Button variant="outline" size="lg">
                  Conocer Más
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section (Conectado a la API en vivo) */}
      <section className="featured-section">
        <div className="container">
          <div className="featured-header">
            <div>
              <Badge variant="default">Selección Especial</Badge>
              <h2 className="featured-title">Productos Destacados</h2>
            </div>
            <Link to="/catalogo" className="featured-more-link">
              Ver todos los productos <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {isLoading ? (
            <div className="featured-grid" aria-busy="true" aria-label="Cargando productos destacados">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="featured-skeleton">
                  <Skeleton height="260px" borderRadius="var(--radius-lg)" />
                  <div style={{ padding: 'var(--space-3)' }}>
                    <Skeleton width="40%" height="14px" style={{ marginBottom: '8px' }} />
                    <Skeleton width="80%" height="20px" style={{ marginBottom: '12px' }} />
                    <Skeleton width="35%" height="22px" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="featured-grid">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Value Propositions / Trust */}
      <section className="values-section">
        <div className="container values__grid">
          <div className="value-card">
            <div className="value-card__icon"><Sparkles size={24} /></div>
            <h3>Fórmulas Seguras</h3>
            <p>Ingredientes testeados dermatológicamente y aptos para pieles sensibles.</p>
          </div>
          <div className="value-card">
            <div className="value-card__icon"><Truck size={24} /></div>
            <h3>Envíos Confiables</h3>
            <p>Cobertura con trazabilidad y empaques ecológicos protectores.</p>
          </div>
          <div className="value-card">
            <div className="value-card__icon"><ShieldCheck size={24} /></div>
            <h3>Compra Segura</h3>
            <p>Transacciones con idempotencia y privacidad estricta de tus datos.</p>
          </div>
          <div className="value-card">
            <div className="value-card__icon"><RefreshCw size={24} /></div>
            <h3>Transparencia Total</h3>
            <p>Precios claros en {BRAND.currency.code} con IVA y especificaciones completas.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
