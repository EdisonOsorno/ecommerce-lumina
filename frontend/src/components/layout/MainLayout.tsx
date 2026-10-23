import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const MainLayout: React.FC = () => {
  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Saltar al contenido principal
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};
