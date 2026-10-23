/**
 * Configuración centralizada de identidad de marca.
 * Cambiar aquí el nombre, logo o textos actualiza toda la plataforma.
 */
export const BRAND = {
  name: 'Lúmina',
  legalName: 'Lúmina Cosméticos & Belleza S.A.S.',
  fallbackName: 'Belleza Demo',
  tagline: 'Cosméticos, cuidado facial, capilar e higiene personal consciente',
  description: 'Fórmulas probadas, seguras y diseñadas para resaltar tu bienestar natural.',
  currency: {
    code: 'COP',
    symbol: '$',
    locale: 'es-CO',
    fractionDigits: 0,
  },
  contact: {
    email: 'contacto@luminacosmeticos.demo',
    phone: '+57 (300) 123-4567',
    address: 'Bogotá D.C., Colombia',
  },
  socials: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
  },
} as const;
