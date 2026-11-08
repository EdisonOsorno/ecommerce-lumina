package com.lumina.admin.upload;

/**
 * Respuesta del endpoint de carga de imágenes de producto.
 * La URL es relativa y pública (se sirve vía /uploads/** en WebConfig).
 */
public record UploadImageResponse(String url) {
}
