import React from 'react';
import { Outlet } from 'react-router-dom';
import { CartProvider } from '@/features/cart/CartContext';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/**
 * Layout raíz de la aplicación.
 *
 * CartProvider envuelve todo para que tanto el Navbar (badge del carrito)
 * como las páginas internas puedan consumir useCart().
 */
export const MainLayout: React.FC = () => {
  return (
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
  );
};
