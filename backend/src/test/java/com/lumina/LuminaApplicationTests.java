package com.lumina;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class LuminaApplicationTests {

    @Test
    void contextLoads() {
        // Verifica que el contexto de Spring Boot levanta correctamente,
        // que las migraciones Flyway V1 se ejecutan sin errores
        // y que todas las entidades JPA validan contra el esquema de base de datos.
    }
}
