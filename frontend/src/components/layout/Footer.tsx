import React from 'react';
import { BRAND } from '@/config/brand';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer__content">
        <div className="footer__brand-col">
          <span className="footer__brand-name">{BRAND.name}</span>
          <p className="footer__tagline">{BRAND.tagline}</p>
          <p className="footer__disclaimer">
            Proyecto desarrollado con fines demostrativos y portafolio técnico.
            Las imágenes, descripciones y valores son ficticios.
          </p>
        </div>

        <div className="footer__links-col">
          <h4 className="footer__heading">Navegación</h4>
          <ul className="footer__list">
            <li><a href="/catalogo">Catálogo de Productos</a></li>
            <li><a href="/carrito">Carrito</a></li>
            <li><a href="/nosotros">Sobre el Proyecto</a></li>
          </ul>
        </div>

        <div className="footer__links-col">
          <h4 className="footer__heading">Seguridad & Políticas</h4>
          <ul className="footer__list">
            <li><span>Pagos simulados y cifrados</span></li>
            <li><span>Privacidad y protección de datos</span></li>
            <li><span>Accesibilidad WCAG 2.2 AA</span></li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <span>&copy; {new Date().getFullYear()} {BRAND.legalName}. Todos los derechos reservados.</span>
          <span>Moneda de referencia: {BRAND.currency.code} (IVA incluido)</span>
        </div>
      </div>
    </footer>
  );
};
