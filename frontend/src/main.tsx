import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import './styles/main.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Elemento raíz #root no encontrado en el DOM.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
