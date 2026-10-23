import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { HomePage } from '@/features/home/HomePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'catalogo',
        element: (
          <div className="container" style={{ padding: 'var(--space-12) var(--space-4)' }}>
            <h2>Catálogo de Cosméticos & Belleza</h2>
            <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
              Módulo de catálogo en preparación para la Fase 2 con conexión a PostgreSQL.
            </p>
          </div>
        ),
      },
      {
        path: 'carrito',
        element: (
          <div className="container" style={{ padding: 'var(--space-12) var(--space-4)' }}>
            <h2>Tu Bolsa de Compras</h2>
            <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
              Tu bolsa de compras está vacía actualmente.
            </p>
          </div>
        ),
      },
      {
        path: 'nosotros',
        element: (
          <div className="container" style={{ padding: 'var(--space-12) var(--space-4)' }}>
            <h2>Sobre Lúmina</h2>
            <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
              Plataforma de comercio electrónico diseñada para garantizar la máxima seguridad,
              accesibilidad y rendimiento en la compra de cosméticos y productos de higiene.
            </p>
          </div>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
