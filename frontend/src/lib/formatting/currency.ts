import { BRAND } from '@/config/brand';

/**
 * Formatea un valor numérico a moneda local (por defecto COP con cero decimales).
 */
export function formatCurrency(amount: number | string): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numeric)) {
    return `${BRAND.currency.symbol}0`;
  }

  return new Intl.NumberFormat(BRAND.currency.locale, {
    style: 'currency',
    currency: BRAND.currency.code,
    maximumFractionDigits: BRAND.currency.fractionDigits,
    minimumFractionDigits: BRAND.currency.fractionDigits,
  }).format(numeric);
}
