package com.lumina.admin.upload;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/**
 * Carga de imágenes de producto desde el equipo del administrador (Fase 5C),
 * bajo /api/admin/** → hasRole("ADMIN") en SecurityConfig.
 *
 * Los archivos se guardan físicamente en ./uploads/products/ con nombre único
 * (UUID + "-" + nombre original) y se exponen públicos vía /uploads/**
 * configurado en WebConfig, para que catálogo y clientes los vean sin sesión.
 */
@RestController
@RequestMapping(path = "/api/admin/uploads", produces = MediaType.APPLICATION_JSON_VALUE)
public class AdminUploadController {

    /** Content types válidos; cualquier otra cosa se rechaza con 400. */
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    /** Directorio físico de las fotos de catálogo: ./uploads/products. */
    private static final Path UPLOAD_DIR = Paths.get("uploads", "products").toAbsolutePath();

    @PostMapping(path = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadImageResponse uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Selecciona un archivo de imagen para subir.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Formato de imagen no soportado. Solo se admiten JPG, PNG o WebP.");
        }

        // Defensive sanitation: only the name is preserved, discarding any dangerous relative path
        // (path traversal) that a forged client might attempt to send on "originalFilename".
        Path safeOriginal = Paths.get(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String originalFilename = safeOriginal.getFileName() == null ? "imagen" : safeOriginal.getFileName().toString();

        // Unique name to avoid overwrites and collisions between products.
        String storedFilename = UUID.randomUUID() + "-" + originalFilename;

        Files.createDirectories(UPLOAD_DIR);
        Path target = UPLOAD_DIR.resolve(storedFilename);
        try (var content = file.getInputStream()) {
            Files.copy(content, target, StandardCopyOption.REPLACE_EXISTING);
        }

        return new UploadImageResponse("/uploads/products/" + storedFilename);
    }
}
