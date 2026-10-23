package com.lumina.catalog.dto;

import com.lumina.catalog.domain.Product;
import java.math.BigDecimal;
import java.math.RoundingMode;

public record ProductDetailResponse(
        Long id,
        String name,
        String slug,
        String sku,
        String description,
        String categoryName,
        String categorySlug,
        String imageUrl,
        BigDecimal price,
        BigDecimal compareAtPrice,
        BigDecimal vatRate,
        BigDecimal netBasePrice,
        BigDecimal vatAmount,
        boolean hasDiscount,
        Integer discountPercentage,
        boolean isFeatured,
        int availableStock,
        boolean inStock
) {
    public static ProductDetailResponse from(Product product, int availableStock) {
        boolean hasDiscount = product.getCompareAtPrice() != null &&
                              product.getCompareAtPrice().compareTo(product.getPrice()) > 0;

        Integer discountPercentage = null;
        if (hasDiscount) {
            BigDecimal diff = product.getCompareAtPrice().subtract(product.getPrice());
            discountPercentage = diff.multiply(BigDecimal.valueOf(100))
                    .divide(product.getCompareAtPrice(), 0, RoundingMode.HALF_UP)
                    .intValue();
        }

        // Desglose del IVA (Precios con IVA incluido al consumidor)
        // Base = Precio / (1 + TasaIVA)
        BigDecimal vatFactor = BigDecimal.ONE.add(product.getVatRate());
        BigDecimal netBasePrice = product.getPrice().divide(vatFactor, 2, RoundingMode.HALF_UP);
        BigDecimal vatAmount = product.getPrice().subtract(netBasePrice);

        return new ProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getSku(),
                product.getDescription(),
                product.getCategory().getName(),
                product.getCategory().getSlug(),
                product.getImageUrl(),
                product.getPrice(),
                product.getCompareAtPrice(),
                product.getVatRate(),
                netBasePrice,
                vatAmount,
                hasDiscount,
                discountPercentage,
                product.isFeatured(),
                availableStock,
                availableStock > 0
        );
    }
}
