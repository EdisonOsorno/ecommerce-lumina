export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  sku: string;
  categoryName: string;
  categorySlug: string;
  imageUrl: string;
  price: number;
  compareAtPrice: number | null;
  vatRate: number;
  hasDiscount: boolean;
  discountPercentage: number | null;
  isFeatured: boolean;
  inStock: boolean;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  netBasePrice: number;
  vatAmount: number;
  availableStock: number;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}
