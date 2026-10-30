package com.lumina.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina.auth.dto.LoginRequest;
import com.lumina.auth.dto.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("POST /api/auth/register - Registra nuevo usuario exitosamente con HTTP 201")
    void shouldRegisterNewUserSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Laura Gómez",
                "laura.gomez@example.com",
                "PasswordSeguro123!",
                "+573001234567"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.email", is("laura.gomez@example.com")))
                .andExpect(jsonPath("$.fullName", is("Laura Gómez")))
                .andExpect(jsonPath("$.role", is("ROLE_CUSTOMER")));
    }

    @Test
    @DisplayName("POST /api/auth/register - Falla con 409 si el email ya está registrado")
    void shouldFailWhenEmailAlreadyExists() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Carlos Pérez",
                "carlos.duplicado@example.com",
                "PasswordSeguro123!",
                null
        );

        // Primer registro exitoso
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Segundo registro con el mismo email debe fallar con 409 Conflict
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/auth/register - Falla con 400 si la contraseña es menor a 8 caracteres")
    void shouldFailWhenPasswordTooShort() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Ana María",
                "ana.corta@example.com",
                "12345", // Menos de 8 caracteres
                null
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/login - Autentica usuario existente con HTTP 200")
    void shouldLoginSuccessfully() throws Exception {
        // Registrar usuario
        RegisterRequest registerReq = new RegisterRequest(
                "Mateo Silva",
                "mateo.login@example.com",
                "ContrasenaFuerte2026*",
                null
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        // Iniciar sesión
        LoginRequest loginReq = new LoginRequest("mateo.login@example.com", "ContrasenaFuerte2026*");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.email", is("mateo.login@example.com")))
                .andExpect(jsonPath("$.fullName", is("Mateo Silva")));
    }

    @Test
    @DisplayName("POST /api/auth/login - Falla con 401 si las credenciales son incorrectas")
    void shouldFailLoginWithBadCredentials() throws Exception {
        LoginRequest loginReq = new LoginRequest("inexistente@example.com", "claveIncorrecta");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/catalog/products - Ruta pública accesible sin token")
    void shouldAccessCatalogWithoutToken() throws Exception {
        mockMvc.perform(get("/api/catalog/products"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/orders - Ruta protegida rechaza petición sin token con 401 o 403")
    void shouldRejectOrdersWithoutToken() throws Exception {
        mockMvc.perform(post("/api/orders"))
                .andExpect(status().isForbidden());
    }
}
