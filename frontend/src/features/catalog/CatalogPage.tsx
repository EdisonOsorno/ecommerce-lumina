import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Category, ProductSummary, PageResponse } from '@/types/catalog';
import { fetchCategories, fetchProducts } from '@/lib/api/catalog';
import { ProductCard } from './components/ProductCard';
import { CategoryFilter } from './components/CategoryFilter';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import './CatalogPage.css';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCategory = searchParams.get('categoria') || undefined;
  const currentSearch = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('pagina') || '0', 10);
  const currentSort = searchParams.get('orden') || 'id,desc';

  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogPage, setCatalogPage] = useState<PageResponse<ProductSummary> | null>(null);
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar categorías iniciales
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => {
        console.error('Error al cargar categorías:', err);
      });
  }, []);

  // Cargar productos al cambiar filtros
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProducts({
        category: currentCategory,
        search: currentSearch || undefined,
        page: currentPage,
        size: 8,
        sort: currentSort,
      });
      setCatalogPage(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al cargar el catálogo.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [currentCategory, currentSearch, currentPage, currentSort]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Manejadores de interacción
  const handleCategorySelect = (categorySlug: string | undefined) => {
    const nextParams = new URLSearchParams(searchParams);
    if (categorySlug) {
      nextParams.set('categoria', categorySlug);
    } else {
      nextParams.delete('categoria');
    }
    nextParams.set('pagina', '0');
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      nextParams.set('q', searchInput.trim());
    } else {
      nextParams.delete('q');
    }
    nextParams.set('pagina', '0');
    setSearchParams(nextParams);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    nextParams.set('pagina', '0');
    setSearchParams(nextParams);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('orden', e.target.value);
    nextParams.set('pagina', '0');
    setSearchParams(nextParams);
  };

  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('pagina', newPage.toString());
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="catalog-page">
      <div className="container catalog-page__container">
        {/* Encabezado */}
        <header className="catalog-header">
          <h1 className="catalog-title">Catálogo de Cosméticos & Belleza</h1>
          <p className="catalog-subtitle">
            Productos dermatológicos, botánicos y de higiene formulados para tu cuidado diario.
          </p>
        </header>

        {/* Barra de Filtros y Búsqueda */}
        <div className="catalog-controls">
          <form className="catalog-search-form" onSubmit={handleSearchSubmit} role="search">
            <Search className="catalog-search-icon" size={18} aria-hidden="true" />
            <input
              type="text"
              className="catalog-search-input"
              placeholder="Buscar por nombre o ingrediente..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Buscar productos"
            />
            {searchInput && (
              <button
                type="button"
                className="catalog-search-clear"
                onClick={handleClearSearch}
                aria-label="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
            <Button type="submit" variant="primary" size="sm">
              Buscar
            </Button>
          </form>

          <div className="catalog-sort">
            <SlidersHorizontal size={16} className="catalog-sort-icon" aria-hidden="true" />
            <label htmlFor="catalog-sort-select" className="catalog-sort-label">
              Ordenar por:
            </label>
            <select
              id="catalog-sort-select"
              className="catalog-sort-select"
              value={currentSort}
              onChange={handleSortChange}
            >
              <option value="id,desc">Más recientes</option>
              <option value="price,asc">Precio: menor a mayor</option>
              <option value="price,desc">Precio: mayor a menor</option>
              <option value="name,asc">Nombre A-Z</option>
            </select>
          </div>
        </div>

        {/* Filtros de Categoría */}
        <CategoryFilter
          categories={categories}
          selectedCategorySlug={currentCategory}
          onSelectCategory={handleCategorySelect}
        />

        {/* Estado de Error */}
        {error && (
          <Alert variant="error" title="No se pudo cargar el catálogo">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              style={{ marginTop: 'var(--space-2)' }}
              onClick={loadProducts}
            >
              Reintentar
            </Button>
          </Alert>
        )}

        {/* Estado de Carga */}
        {isLoading && (
          <div className="catalog-grid" aria-busy="true" aria-label="Cargando productos">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="product-skeleton-card">
                <Skeleton height="260px" borderRadius="var(--radius-lg)" />
                <div style={{ padding: 'var(--space-3)' }}>
                  <Skeleton width="40%" height="14px" style={{ marginBottom: '8px' }} />
                  <Skeleton width="85%" height="20px" style={{ marginBottom: '12px' }} />
                  <Skeleton width="30%" height="22px" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado Vacío */}
        {!isLoading && !error && catalogPage && catalogPage.content.length === 0 && (
          <div className="catalog-empty">
            <div className="catalog-empty__icon">🔍</div>
            <h3>No se encontraron productos</h3>
            <p>
              No hay productos disponibles que coincidan con los filtros seleccionados.
            </p>
            <Button variant="outline" size="md" onClick={handleResetFilters}>
              Restablecer filtros
            </Button>
          </div>
        )}

        {/* Grilla de Productos */}
        {!isLoading && !error && catalogPage && catalogPage.content.length > 0 && (
          <>
            <div className="catalog-results-info">
              <span>
                Mostrando {catalogPage.content.length} de {catalogPage.totalElements} productos
              </span>
            </div>

            <div className="catalog-grid">
              {catalogPage.content.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Paginador */}
            {catalogPage.totalPages > 1 && (
              <nav className="catalog-pagination" aria-label="Paginación del catálogo">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!catalogPage.hasPrevious}
                  onClick={() => handlePageChange(catalogPage.pageNumber - 1)}
                  aria-label="Página anterior"
                >
                  Anterior
                </Button>

                <div className="catalog-pagination__pages">
                  {Array.from({ length: catalogPage.totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`pagination-number ${idx === catalogPage.pageNumber ? 'is-active' : ''}`}
                      onClick={() => handlePageChange(idx)}
                      aria-current={idx === catalogPage.pageNumber ? 'page' : undefined}
                      aria-label={`Ir a página ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!catalogPage.hasNext}
                  onClick={() => handlePageChange(catalogPage.pageNumber + 1)}
                  aria-label="Página siguiente"
                >
                  Siguiente
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
};
