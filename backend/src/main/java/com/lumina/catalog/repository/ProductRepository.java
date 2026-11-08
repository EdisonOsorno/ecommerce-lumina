package com.lumina.catalog.repository;

import com.lumina.catalog.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySlugAndActiveTrue(String slug);

    List<Product> findByFeaturedTrueAndActiveTrueOrderByIdDesc();

    @Query("SELECT p FROM Product p " +
           "WHERE p.active = true " +
           "AND (:categorySlug IS NULL OR p.category.slug = :categorySlug) " +
           "AND (:searchTerm IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "     OR LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Product> searchCatalog(
            @Param("categorySlug") String categorySlug,
            @Param("searchTerm") String searchTerm,
            Pageable pageable
    );

    // ------------------------------------------------------------------
    // Backoffice (Fase 5C): CRUD comercial de productos
    // ------------------------------------------------------------------

    /** Unicidad del SKU (insensible a mayúsculas) antes de crear. */
    boolean existsBySkuIgnoreCase(String sku);

    /** Unicidad del slug generado a partir del nombre antes de crear. */
    boolean existsBySlugIgnoreCase(String slug);

    /** Listado admin de TODOS los productos (activos e inactivos), más nuevos primero. */
    List<Product> findAllByOrderByIdDesc();
}
