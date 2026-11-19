package com.lumina.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina.auth.domain.PasswordResetToken;
import com.lumina.auth.repository.PasswordResetTokenRepository;
import com.lumina.users.domain.User;
import com.lumina.users.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests de integración del flujo de recuperación de contraseña (Fase 5E):
 * solicitud anti-enumeración, verificación de token (válido/expirado),
 * restablecimiento con login posterior y token de un solo uso.
 *
 * Cada test registra su propia cuenta con email disjunto para no interferir
 * con las otras suites que comparten la BD H2 de test (y porque solicitar un
 * enlace invalida los tokens previos del mismo usuario).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PasswordResetIntegrationTest {

    private static final String PASSWORD_INICIAL = "ContrasenaFuerte2026";
    private static final String PASSWORD_NUEVA = "NuevaClaveSegura2026";
    private static final String NEUTRAL_MESSAGE =
            "Si el correo está registrado, recibirás las instrucciones para restablecer tu contraseña.";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    // ------------------------------------------------------------------
    // 1) POST /forgot-password con email existente → 200 + resetToken
    // ------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/auth/forgot-password - Cuenta existente recibe token de recuperación")
    void shouldGenerateResetTokenForExistingEmail() throws Exception {
        String email = "forgot.existente@example.com";
        register(email, "Forgot Existente");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email))))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message", is(NEUTRAL_MESSAGE)))
                .andExpect(jsonPath("$.resetToken", notNullValue()));
    }

    // ------------------------------------------------------------------
    // 2) POST /forgot-password con email inexistente → 200 neutro, sin token
    //    (anti-enumeración: no revela si la cuenta existe)
    // ------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/auth/forgot-password - Email inexistente responde neutro y sin token")
    void shouldNotRevealUnknownEmail() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "forgot.inexistente@example.com"))))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message", is(NEUTRAL_MESSAGE)))
                .andExpect(jsonPath("$.resetToken", nullValue()));
    }

    // ------------------------------------------------------------------
    // 3) GET /verify-reset-token con token vigente → 200 valid: true
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/auth/verify-reset-token - Token vigente responde válido")
    void shouldVerifyValidToken() throws Exception {
        String email = "verify.valido@example.com";
        register(email, "Verify Valido");
        String token = requestResetToken(email);

        mockMvc.perform(get("/api/auth/verify-reset-token").param("token", token))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.valid", is(true)))
                .andExpect(jsonPath("$.message", is("Token válido")));
    }

    // ------------------------------------------------------------------
    // 4) GET /verify-reset-token con token inexistente o expirado → 400
    //    ProblemDetail
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/auth/verify-reset-token - Token inexistente o expirado responde 400")
    void shouldRejectMissingOrExpiredToken() throws Exception {
        // Token que no existe en la tabla
        mockMvc.perform(get("/api/auth/verify-reset-token")
                        .param("token", "token-que-no-existe-fase5e"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title", is("Token de recuperación inválido")))
                .andExpect(jsonPath("$.type", is("https://lumina.demo/errors/invalid-reset-token")));

        // Token expirado real (insertado con expiresAt en el pasado)
        String email = "verify.expirado@example.com";
        register(email, "Verify Expirado");
        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();

        PasswordResetToken expired = new PasswordResetToken();
        expired.setUser(user);
        expired.setToken("token-expirado-fase5e");
        expired.setExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS));
        passwordResetTokenRepository.save(expired);

        mockMvc.perform(get("/api/auth/verify-reset-token").param("token", "token-expirado-fase5e"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail", is(
                        "El enlace de recuperación es inválido o ha expirado. Por favor solicita uno nuevo.")));
    }

    // ------------------------------------------------------------------
    // 5) POST /reset-password con token válido → 200; login con la nueva
    //    clave 200 y con la vieja 401
    // ------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/auth/reset-password - Restablece la clave y permite login con la nueva")
    void shouldResetPasswordAndAllowLoginWithNewOne() throws Exception {
        String email = "reset.valido@example.com";
        register(email, "Reset Valido");
        String token = requestResetToken(email);

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", token,
                                "newPassword", PASSWORD_NUEVA))))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message", is(
                        "Contraseña restablecida exitosamente. Ya puedes iniciar sesión.")));

        // Login con la NUEVA contraseña → 200 + JWT
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", PASSWORD_NUEVA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()));

        // La contraseña ANTERIOR ya no sirve → 401
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", PASSWORD_INICIAL))))
                .andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------------
    // 6) POST /reset-password reutilizando un token consumido → 400
    // ------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/auth/reset-password - Rechaza reutilizar un token ya consumido")
    void shouldRejectAlreadyUsedToken() throws Exception {
        String email = "reset.consumido@example.com";
        register(email, "Reset Consumido");
        String token = requestResetToken(email);

        // Primer uso: éxito
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", token,
                                "newPassword", PASSWORD_NUEVA))))
                .andExpect(status().isOk());

        // Segundo uso del mismo token: 400 ProblemDetail
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", token,
                                "newPassword", "OtraClaveDistinta2026"))))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title", is("Token de recuperación inválido")));
    }

    // ------------------------------------------------------------------
    // 7) POST /reset-password con contraseña de menos de 8 caracteres → 400
    //    de Bean Validation
    // ------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/auth/reset-password - Rechaza nueva clave de menos de 8 caracteres")
    void shouldValidateNewPasswordLength() throws Exception {
        String email = "reset.corta@example.com";
        register(email, "Reset Corta");
        String token = requestResetToken(email);

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", token,
                                "newPassword", "corta"))))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title", is("Error de validación de datos")));
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /** Registra una cuenta de prueba (email único por test). */
    private void register(String email, String fullName) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", fullName,
                                "email", email,
                                "password", PASSWORD_INICIAL,
                                "phone", "+573001234567"))))
                .andExpect(status().isCreated());
    }

    /** Solicita el enlace de recuperación y extrae el resetToken de la respuesta demo. */
    private String requestResetToken(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetToken", notNullValue()))
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("resetToken").asText();
    }
}
