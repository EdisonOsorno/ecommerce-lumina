import React from 'react';
import { Category } from '@/types/catalog';
import './CategoryFilter.css';

export interface CategoryFilterProps {
  categories: Category[];
  selectedCategorySlug?: string;
  onSelectCategory: (categorySlug: string | undefined) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategorySlug,
  onSelectCategory,
}) => {
  return (
    <div className="category-filter" role="toolbar" aria-label="Filtrar por categoría">
      <button
        type="button"
        className={`category-pill ${!selectedCategorySlug ? 'is-active' : ''}`}
        onClick={() => onSelectCategory(undefined)}
        aria-pressed={!selectedCategorySlug}
      >
        Todos
      </button>

      {categories.map((cat) => {
        const isActive = selectedCategorySlug === cat.slug;
        return (
          <button
            key={cat.id}
            type="button"
            className={`category-pill ${isActive ? 'is-active' : ''}`}
            onClick={() => onSelectCategory(isActive ? undefined : cat.slug)}
            aria-pressed={isActive}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};
