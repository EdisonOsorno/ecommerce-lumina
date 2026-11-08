package com.lumina.catalog.service;

import com.lumina.catalog.domain.Category;
import com.lumina.catalog.domain.Product;
import com.lumina.catalog.dto.AdminProductResponse;
import com.lumina.catalog.dto.CreateProductRequest;
import com.lumina.catalog.dto.UpdateProductRequest;
import com.lumina.catalog.repository.CategoryRepository;
import com.lumina.catalog.repository.ProductRepository;
import com.lumina.inventory.domain.InventoryItem;
import com.lumina.inventory.domain.StockMovement;
import com.lumina.inventory.repository.InventoryItemRepository;
import com.lumina.inventory.repository.StockMovementRepository;
import com.lumina.shared.errors.ResourceNotFoundException;
import com.lumina.shared.errors.SkuAlreadyExistsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.List;

/**
 * CRUD comercial de productos para el backoffice (Fase 5C).
 *
 * Regla de oro del negocio: los productos NUNCA se borran físicamente
 * (DELETE) para proteger la integridad histórica de las órdenes ya compradas;
 * la salida de portafolio se hace por regalo / desactivación (is_active).
 *
 *Al crear un producto se genera su inventario inicial (minStockAlert = 5) y
 * se audita el movimiento IN_INITIAL_SEED cuando trae stock > 0.
 */
@Service
public class AdminCatalogService {

    private static final String DEFAULT_VAT_RATE = "0.1900";
    private static final int DEFAULT_MIN_STOCK_ALERT = 5;
    private static final int RESERVED_QUANTITY_ON_CREATION = 0;
    private static final int SLUG_RANDOM_LENGTH = 4;
    private static final int SLUG_MAX_ATTEMPTS = 5;

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final StockMovementRepository stockMovementRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    public AdminCatalogService(ProductRepository productRepository,
                               CategoryRepository categoryRepository,
                               InventoryItemRepository inventoryItemRepository,
                               StockMovementRepository stockMovementRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.stockMovementRepository = stockMovementRepository;
    }

    /**
     * Listado administrativo de TODOS los productos (activos e inactivos),
     * de más nuevo a más antiguo, con su stock disponible disponible.
     */
    @Transactional(readOnly = true)
    public List<AdminProductResponse> listAllProductsForAdmin() {
        return productRepository.findAllByOrderByIdDesc().stream()
                .map(product -> toAdminResponse(product, inventoryItemRepository
                        .findByProductId(product.getId())
                        .orElse(null)))
                .toList();
    }

    /**
     * Crea un producto con inventario inicial y auditoría de stock.
     *
     * @throws SkuAlreadyExistsException si el SKU ya existe (→ 409)
     * @throws ResourceNotFoundException si la categoría no existe (→ 404)
     * @throws IllegalArgumentException  si compareAtPrice < price (→ 400)
     */
    @Transactional
    public AdminProductResponse createProduct(CreateProductRequest request) {
        String sku = request.sku().trim();
        if (productRepository.existsBySkuIgnoreCase(sku)) {
            throw new SkuAlreadyExistsException("Ya existe un producto con el SKU: " + sku);
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "La categoría " + request.categoryId() + " no existe"));

        BigDecimal price = request.price();
        BigDecimal compareAtPrice = request.compareAtPrice();
        validateCompareAtPrice(price, compareAtPrice);

        Product product = new Product();
        product.setName(request.name().trim());
        product.setSlug(generateUniqueSlug(request.name()));
        product.setSku(sku);
        product.setDescription(trimToNull(request.description()));
        product.setImageUrl(trimToNull(request.imageUrl()));
        product.setPrice(price);
        product.setCompareAtPrice(compareAtPrice);
        product.setVatRate(request.vatRate() != null
                ? request.vatRate().setScale(4, RoundingMode.HALF_UP)
                : new BigDecimal(DEFAULT_VAT_RATE));
        product.setCategory(category);
        product.setActive(true);
        product.setFeatured(false);

        Product saved = productRepository.save(product);

        int initialStock = request.initialStock() != null ? request.initialStock() : 0;
        InventoryItem item = new InventoryItem();
        item.setProduct(saved);
        item.setAvailableQuantity(initialStock);
        item.setReservedQuantity(RESERVED_QUANTITY_ON_CREATION);
        item.setMinStockAlert(DEFAULT_MIN_STOCK_ALERT);
        inventoryItemRepository.save(item);

        if (initialStock > 0) {
            StockMovement movement = new StockMovement();
            movement.setProduct(saved);
            movement.setMovementType("IN_INITIAL_SEED");
            movement.setQuantity(initialStock);
            movement.setBalanceAfter(initialStock);
            movement.setReason("Inventario inicial al crear producto");
            movement.setReferenceId("PRODUCT_CREATION");
            stockMovementRepository.save(movement);
        }

        return toAdminResponse(saved, item);
    }

    /**
     * Edita los campos comerciales de un producto existente.
     * El SKU y el slug no cambian (claves de negocio y enlaces públicos).
     * Si vatRate viene nulo se conserva la tarifa vigente del producto.
     *
     * @throws ResourceNotFoundException si el producto o la categoría no existen (→ 404)
     * @throws IllegalArgumentException  si compareAtPrice < price (→ 400)
     */
    @Transactional
    public AdminProductResponse updateProduct(Long productId, UpdateProductRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "El producto " + productId + " no existe"));

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "La categoría " + request.categoryId() + " no existe"));

        BigDecimal price = request.price();
        BigDecimal compareAtPrice = request.compareAtPrice();
        validateCompareAtPrice(price, compareAtPrice);

        product.setName(request.name().trim());
        product.setDescription(trimToNull(request.description()));
        product.setImageUrl(trimToNull(request.imageUrl()));
        product.setPrice(price);
        product.setCompareAtPrice(compareAtPrice);
        product.setVatRate(request.vatRate() != null
                ? request.vatRate().setScale(4, RoundingMode.HALF_UP)
                : product.getVatRate());
        product.setCategory(category);

        Product saved = productRepository.save(product);
        InventoryItem item = inventoryItemRepository.findByProductId(saved.getId()).orElse(null);
        return toAdminResponse(saved, item);
    }

    /**
     * Regalo / desactivación (soft delete): invierte is_active. Los productos
     * inactivos desaparecen de inmediato de /api/catalog/products (que solo
     * lista active = true), pero conservan su historial en las órdenes.
     *
     * @throws ResourceNotFoundException si el producto no existe (→ 404)
     */
    @Transactional
    public AdminProductResponse toggleProductStatus(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "El producto " + productId + " no existe"));

        product.setActive(!product.isActive());
        Product saved = productRepository.save(product);
        InventoryItem item = inventoryItemRepository.findByProductId(saved.getId()).orElse(null);
        return toAdminResponse(saved, item);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private void validateCompareAtPrice(BigDecimal price, BigDecimal compareAtPrice) {
        if (compareAtPrice != null && compareAtPrice.compareTo(price) < 0) {
            throw new IllegalArgumentException(
                    "El precio de comparación debe ser mayor o igual al precio de venta");
        }
    }

    /**
     * Slug legible y URL-safe: minúsculas, sin acentos, no alfanuméricos → '-'.
     * Garantiza unicidad con sufijo aleatorio ante colisión (probabilidad ínfima).
     */
    private String generateUniqueSlug(String name) {
        String base = toSlug(name);
        if (!productRepository.existsBySlugIgnoreCase(base)) {
            return base;
        }
        for (int attempt = 0; attempt < SLUG_MAX_ATTEMPTS; attempt++) {
            String candidate = base + "-" + randomSuffix(SLUG_RANDOM_LENGTH);
            if (!productRepository.existsBySlugIgnoreCase(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("No se pudo generar un slug único. Reintenta.");
    }

    private String toSlug(String name) {
        String withoutAccents = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String slug = withoutAccents.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        return slug.isEmpty() ? "producto" : slug;
    }

    private String randomSuffix(int length) {
        final String alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder suffix = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            suffix.append(alphabet.charAt(secureRandom.nextInt(alphabet.length())));
        }
        return suffix.toString();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** Mapea producto + fila de inventario (o null → 0 disponible) al DTO admin. */
    private AdminProductResponse toAdminResponse(Product product, InventoryItem item) {
        return new AdminProductResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getSku(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getPrice(),
                product.getCompareAtPrice(),
                product.getVatRate(),
                product.getImageUrl(),
                product.isActive(),
                product.isFeatured(),
                item != null ? item.getAvailableQuantity() : 0,
                product.getCreatedAt()
        );
    }
}
