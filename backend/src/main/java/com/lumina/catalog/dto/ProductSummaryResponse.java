package com.lumina.catalog.dto;

import com.lumina.catalog.domain.Product;
import java.math.BigDecimal;
import java.math.RoundingMode;

public record ProductSummaryResponse(
        Long id,
        String name,
        String slug,
        String sku,
        String categoryName,
        String categorySlug,
        String imageUrl,
        BigDecimal price,
        BigDecimal compareAtPrice,
        BigDecimal vatRate,
        boolean hasDiscount,
        Integer discountPercentage,
        boolean isFeatured,
        boolean inStock
) {
    public static ProductSummaryResponse from(Product product, boolean inStock) {
        boolean hasDiscount = product.getCompareAtPrice() != null &&
                              product.getCompareAtPrice().compareTo(product.getPrice()) > 0;

        Integer discountPercentage = null;
        if (hasDiscount) {
            BigDecimal diff = product.getCompareAtPrice().subtract(product.getPrice());
            discountPercentage = diff.multiply(BigDecimal.valueOf(100))
                    .divide(product.getCompareAtPrice(), 0, RoundingMode.HALF_UP)
                    .intValue();
        }

        return new ProductSummaryResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getSku(),
                product.getCategory().getName(),
                product.getCategory().getSlug(),
                product.getImageUrl(),
                product.getPrice(),
                product.getCompareAtPrice(),
                product.getVatRate(),
                hasDiscount,
                discountPercentage,
                product.isFeatured(),
                inStock
        );
    }
}
