import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  ChevronDown,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
} from 'lucide-react';
import { BRAND } from '@/config/brand';
import { useCart } from '@/features/cart/CartContext';
import { useAuth } from '@/features/auth/AuthContext';
import './Navbar.css';

/**
 * Cabecera principal. Cuando hay sesión, el saludo se convierte en un menú
 * desplegable de usuario (Mi Perfil, Mis Pedidos, Panel Admin si aplica y
 * Cerrar Sesión) que se cierra con clic fuera, Escape o al navegar.
 */
export const Navbar: React.FC = () => {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  // Cierre por clic fuera del menú (hook ligero sin dependencias externas)
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // Si la sesión termina (logout desde otro punto), el menú no debe quedar abierto
  useEffect(() => {
    if (!user) {
      setIsMenuOpen(false);
    }
  }, [user]);

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
            <div className="navbar__user" ref={userMenuRef}>
              <button
                type="button"
                className="navbar__action-btn navbar__user-trigger"
                onClick={() => setIsMenuOpen((open) => !open)}
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                aria-controls="navbar-user-menu"
                aria-label="Abrir menú de usuario"
              >
                <User size={20} aria-hidden="true" />
                <span className="navbar__action-text">
                  Hola, {user.fullName.split(' ')[0]}
                </span>
                <ChevronDown
                  size={16}
                  className={`navbar__chevron ${isMenuOpen ? 'navbar__chevron--open' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {isMenuOpen && (
                <div
                  id="navbar-user-menu"
                  className="navbar__user-menu"
                  role="menu"
                  aria-label="Menú de usuario"
                >
                  <div className="navbar__user-menu-header">
                    <p className="navbar__user-menu-name">{user.fullName}</p>
                    <p className="navbar__user-menu-email">{user.email}</p>
                    {user.role === 'ROLE_ADMIN' && (
                      <span className="navbar__user-menu-badge">Administrador</span>
                    )}
                  </div>

                  <hr className="navbar__user-menu-divider" />

                  <Link
                    to="/cuenta/perfil"
                    className="navbar__user-menu-link"
                    role="menuitem"
                    onClick={closeMenu}
                  >
                    <User size={18} aria-hidden="true" />
                    Mi Perfil
                  </Link>
                  <Link
                    to="/cuenta/pedidos"
                    className="navbar__user-menu-link"
                    role="menuitem"
                    onClick={closeMenu}
                  >
                    <Package size={18} aria-hidden="true" />
                    Mis Pedidos
                  </Link>
                  {user.role === 'ROLE_ADMIN' && (
                    <Link
                      to="/admin"
                      className="navbar__user-menu-link"
                      role="menuitem"
                      onClick={closeMenu}
                    >
                      <ShieldCheck size={18} aria-hidden="true" />
                      Panel Admin
                    </Link>
                  )}

                  <hr className="navbar__user-menu-divider" />

                  <button
                    type="button"
                    className="navbar__user-menu-link navbar__user-menu-link--logout"
                    role="menuitem"
                    onClick={() => {
                      closeMenu();
                      logout();
                    }}
                  >
                    <LogOut size={18} aria-hidden="true" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
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
