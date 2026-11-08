import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, User, Sparkles, LogOut, ShieldCheck } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { useCart } from '@/features/cart/CartContext';
import { useAuth } from '@/features/auth/AuthContext';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar__top-banner">
        <span>✨ Demostración técnica — Datos de productos y transacciones ficticias</span>
      </div>
      <div className="container navbar__main">
        <Link to="/" className="navbar__brand" aria-label={`${BRAND.name} - Inicio`}>
          <Sparkles className="navbar__logo-icon" aria-hidden="true" />
          <span className="navbar__brand-name">{BRAND.name}</span>
        </Link>

        <nav className="navbar__links" aria-label="Navegación principal">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `navbar__link ${isActive ? 'navbar__link--active' : ''}`
            }
          >
            Inicio
          </NavLink>
          <NavLink
            to="/catalogo"
            className={({ isActive }) =>
              `navbar__link ${isActive ? 'navbar__link--active' : ''}`
            }
          >
            Catálogo
          </NavLink>
          <NavLink
            to="/nosotros"
            className={({ isActive }) =>
              `navbar__link ${isActive ? 'navbar__link--active' : ''}`
            }
          >
            Sobre Lúmina
          </NavLink>
        </nav>

        <div className="navbar__actions">
          {user ? (
            <>
              <Link
                to="/cuenta/pedidos"
                className="navbar__action-btn"
                aria-label="Mis Pedidos"
              >
                <User size={20} aria-hidden="true" />
                <span className="navbar__action-text">
                  Hola, {user.fullName.split(' ')[0]}
                </span>
              </Link>
              {user.role === 'ROLE_ADMIN' && (
                <Link
                  to="/admin"
                  className="navbar__action-btn navbar__action-btn--admin"
                  aria-label="Panel de Administración"
                >
                  <ShieldCheck size={20} aria-hidden="true" />
                  <span className="navbar__action-text">Panel Admin</span>
                </Link>
              )}
              <button
                type="button"
                className="navbar__action-btn"
                onClick={logout}
                aria-label="Cerrar sesión"
              >
                <LogOut size={20} aria-hidden="true" />
                <span className="navbar__action-text">Salir</span>
              </button>
            </>
          ) : (
            <Link
              to="/cuenta/ingreso"
              className="navbar__action-btn"
              aria-label="Mi Cuenta / Iniciar Sesión"
            >
              <User size={20} aria-hidden="true" />
              <span className="navbar__action-text">Cuenta</span>
            </Link>
          )}
          <Link
            to="/carrito"
            className="navbar__action-btn navbar__action-btn--cart"
            aria-label={`Carrito de compras (${totalItems} ${totalItems === 1 ? 'producto' : 'productos'})`}
          >
            <ShoppingBag size={20} aria-hidden="true" />
            {totalItems > 0 && (
              <span className="navbar__cart-badge" aria-hidden="true">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};
