import { Category, ProductSummary, ProductDetail, PageResponse } from '@/types/catalog';

const API_BASE_URL = '/api/catalog';

export interface CatalogQueryFilters {
  category?: string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) {
    throw new Error(`Error ${response.status}: No se pudieron cargar las categorías.`);
  }
  return response.json();
}

export async function fetchProducts(filters: CatalogQueryFilters = {}): Promise<PageResponse<ProductSummary>> {
  const params = new URLSearchParams();

  if (filters.category) params.append('category', filters.category);
  if (filters.search) params.append('search', filters.search);
  if (filters.page !== undefined) params.append('page', filters.page.toString());
  if (filters.size !== undefined) params.append('size', filters.size.toString());
  if (filters.sort) params.append('sort', filters.sort);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/products${queryString}`);
  if (!response.ok) {
    throw new Error(`Error ${response.status}: No se pudo cargar el catálogo de productos.`);
  }
  return response.json();
}

export async function fetchFeaturedProducts(): Promise<ProductSummary[]> {
  const response = await fetch(`${API_BASE_URL}/featured`);
  if (!response.ok) {
    throw new Error(`Error ${response.status}: No se pudieron cargar los productos destacados.`);
  }
  return response.json();
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetail> {
  const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(slug)}`);
  if (response.status === 404) {
    throw new Error('El producto solicitado no existe o no se encuentra disponible.');
  }
  if (!response.ok) {
    throw new Error(`Error ${response.status}: No se pudo cargar el detalle del producto.`);
  }
  return response.json();
}
