import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import './HomePage.css';

export const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero__container">
          <div className="hero__content">
            <Badge variant="accent">Nueva Colección 2026</Badge>
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
                  Explorar Catálogo
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
