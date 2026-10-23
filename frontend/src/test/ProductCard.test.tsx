import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { ProductSummary } from '@/types/catalog';

const mockProduct: ProductSummary = {
  id: 1,
  name: 'Serum Facial Ácido Hialurónico',
  slug: 'serum-facial-acido-hialuronico',
  sku: 'LUM-FAC-001',
  categoryName: 'Cuidado Facial',
  categorySlug: 'cuidado-facial',
  imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be',
  price: 68000,
  compareAtPrice: 85000,
  vatRate: 0.19,
  hasDiscount: true,
  discountPercentage: 20,
  isFeatured: true,
  inStock: true,
};

describe('ProductCard component', () => {
  it('renders product information accurately', () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    expect(screen.getByText('Serum Facial Ácido Hialurónico')).toBeInTheDocument();
    expect(screen.getByText('Cuidado Facial')).toBeInTheDocument();
    expect(screen.getByText('-20%')).toBeInTheDocument();
    expect(screen.getByText(/• En stock/i)).toBeInTheDocument();
  });

  it('renders out of stock badge when inStock is false', () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    render(
      <MemoryRouter>
        <ProductCard product={outOfStockProduct} />
      </MemoryRouter>
    );

    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(screen.getByText(/• Sin existencias/i)).toBeInTheDocument();
  });

  it('has accessible links pointing to product detail page', () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    const links = screen.getAllByRole('link');
    const hrefs = links.map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/producto/serum-facial-acido-hialuronico');
  });
});
