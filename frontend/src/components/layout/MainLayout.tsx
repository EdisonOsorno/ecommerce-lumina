import React from 'react';
import { Outlet } from 'react-router-dom';
import { CartProvider } from '@/features/cart/CartContext';
import { AuthProvider } from '@/features/auth/AuthContext';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/**
 * Layout raíz de la aplicación.
 *
 * AuthProvider y CartProvider envuelven todo para que tanto el Navbar
 * (estado de sesión y badge del carrito) como las páginas internas
 * puedan consumir useAuth() y useCart().
 */
export const MainLayout: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
      <a href="#main-content" className="skip-to-content">
        Saltar al contenido principal
      </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>
          <Outlet />
        </main>
        <Footer />
      </CartProvider>
    </AuthProvider>
  );
};
