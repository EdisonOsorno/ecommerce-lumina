package com.lumina.catalog.service;

import com.lumina.catalog.domain.Category;
import com.lumina.catalog.domain.Product;
import com.lumina.catalog.dto.CategoryResponse;
import com.lumina.catalog.dto.ProductDetailResponse;
import com.lumina.catalog.dto.ProductSummaryResponse;
import com.lumina.catalog.repository.CategoryRepository;
import com.lumina.catalog.repository.ProductRepository;
import com.lumina.inventory.domain.InventoryItem;
import com.lumina.inventory.repository.InventoryItemRepository;
import com.lumina.shared.dto.PageResponse;
import com.lumina.shared.errors.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CatalogService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public CatalogService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            InventoryItemRepository inventoryItemRepository
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    public List<CategoryResponse> getActiveCategories() {
        return categoryRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(CategoryResponse::from)
                .toList();
    }

    public PageResponse<ProductSummaryResponse> getCatalog(
            String categorySlug,
            String search,
            Pageable pageable
    ) {
        String cleanCategory = (categorySlug != null && !categorySlug.isBlank()) ? categorySlug.trim() : null;
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        Page<Product> productPage = productRepository.searchCatalog(cleanCategory, cleanSearch, pageable);

        Page<ProductSummaryResponse> summaryPage = productPage.map(product -> {
            boolean inStock = inventoryItemRepository.findByProductId(product.getId())
                    .map(item -> item.getAvailableQuantity() > 0)
                    .orElse(false);
            return ProductSummaryResponse.from(product, inStock);
        });

        return PageResponse.from(summaryPage);
    }

    public List<ProductSummaryResponse> getFeaturedProducts() {
        return productRepository.findByFeaturedTrueAndActiveTrueOrderByIdDesc()
                .stream()
                .map(product -> {
                    boolean inStock = inventoryItemRepository.findByProductId(product.getId())
                            .map(item -> item.getAvailableQuantity() > 0)
                            .orElse(false);
                    return ProductSummaryResponse.from(product, inStock);
                })
                .toList();
    }

    public ProductDetailResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con el identificador: " + slug));

        int availableStock = inventoryItemRepository.findByProductId(product.getId())
                .map(InventoryItem::getAvailableQuantity)
                .orElse(0);

        return ProductDetailResponse.from(product, availableStock);
    }
}
