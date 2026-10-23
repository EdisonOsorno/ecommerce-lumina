package com.lumina.shared.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Health", description = "Verificación de estado de la API")
public class HealthController {

    @GetMapping
    @Operation(summary = "Verificar estado de salud del backend")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "app", "Lúmina Backend API",
                "version", "0.1.0",
                "timestamp", Instant.now().toString()
        ));
    }
}
