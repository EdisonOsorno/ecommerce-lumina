import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/lib/formatting/currency';

describe('formatCurrency utility', () => {
  it('formats standard integer amounts in Colombian Pesos', () => {
    const formatted = formatCurrency(45000);
    // Should contain $ and 45
    expect(formatted).toContain('45');
    expect(formatted).toContain('$');
  });

  it('handles zero gracefully', () => {
    const formatted = formatCurrency(0);
    expect(formatted).toContain('0');
  });

  it('handles invalid inputs safely', () => {
    const formatted = formatCurrency('invalid');
    expect(formatted).toBe('$0');
  });
});
