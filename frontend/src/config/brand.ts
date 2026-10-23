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
  defaultProductImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' fill='none'%3E%3Crect width='400' height='400' fill='%23F3EFEC'/%3E%3Cpath d='M200 130v140M130 200h140' stroke='%23C48B71' stroke-width='4' stroke-linecap='round'/%3E%3Ccircle cx='200' cy='200' r='50' stroke='%23872E48' stroke-width='6' stroke-dasharray='8 8'/%3E%3Ctext x='200' y='290' font-family='sans-serif' font-size='16' fill='%237D7579' text-anchor='middle' font-weight='500'%3ELúmina Cosméticos%3C/text%3E%3C/svg%3E",
} as const;
