package com.lumina.users;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests de integración del perfil de usuario (Fase 5D):
 * consulta y actualización de datos personales y cambio de contraseña
 * con verificación de la clave actual, para ROLE_CUSTOMER y ROLE_ADMIN.
 *
 * Cada test registra su propio usuario con email disjunto para no interferir
 * con las otras suites que comparten la BD H2 de test.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserControllerIntegrationTest {

    private static final String PERFIL_EMAIL = "perfil.fase5d@example.com";
    private static final String UPDATE_EMAIL = "perfil.update@example.com";
    private static final String PASSWORD_EMAIL = "password.cambio@example.com";
    private static final String PASSWORD_KO_EMAIL = "password.incorrecta@example.com";
    private static final String VALIDACION_EMAIL = "perfil.validacion@example.com";

    private static final String PASSWORD_INICIAL = "ContrasenaFuerte2026";
    private static final String PASSWORD_NUEVA = "NuevaClaveSegura2026";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ------------------------------------------------------------------
    // 1) GET /api/users/me con token válido → 200 con nombre, apellido,
    //    email y rol del usuario autenticado
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/users/me - Token válido devuelve el perfil completo")
    void shouldReturnAuthenticatedProfile() throws Exception {
        String token = registerAndReturnToken("Laura Perfil", PERFIL_EMAIL);

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.email", is(PERFIL_EMAIL)))
                .andExpect(jsonPath("$.firstName", is("Laura")))
                .andExpect(jsonPath("$.lastName", is("Perfil")))
                .andExpect(jsonPath("$.role", is("ROLE_CUSTOMER")))
                .andExpect(jsonPath("$.createdAt", notNullValue()))
                // El hash de la contraseña NUNCA se expone
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    // ------------------------------------------------------------------
    // 2) PUT /api/users/me con datos válidos → 200 con el perfil actualizado
    // ------------------------------------------------------------------
    @Test
    @DisplayName("PUT /api/users/me - Actualiza nombre, apellido y teléfono")
    void shouldUpdateProfile() throws Exception {
        String token = registerAndReturnToken("Mario Update", UPDATE_EMAIL);

        Map<String, Object> request = Map.of(
                "firstName", "Mariana",
                "lastName", "Actualizada",
                "phone", "+57 (300) 123-4567"
        );

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.email", is(UPDATE_EMAIL)))
                .andExpect(jsonPath("$.firstName", is("Mariana")))
                .andExpect(jsonPath("$.lastName", is("Actualizada")))
                .andExpect(jsonPath("$.phone", is("+57 (300) 123-4567")))
                .andExpect(jsonPath("$.role", is("ROLE_CUSTOMER")));

        // La persistencia se confirma con una nueva consulta del perfil
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName", is("Mariana")))
                .andExpect(jsonPath("$.lastName", is("Actualizada")));
    }

    // ------------------------------------------------------------------
    // 3) PUT /api/users/me/password con clave actual correcta → 200 y
    //    posterior login exitoso con la nueva contraseña
    // ------------------------------------------------------------------
    @Test
    @DisplayName("PUT /api/users/me/password - Cambia la clave y permite login con la nueva")
    void shouldChangePasswordAndLoginWithNewOne() throws Exception {
        String token = registerAndReturnToken("Clave Cambio", PASSWORD_EMAIL);

        Map<String, Object> request = Map.of(
                "currentPassword", PASSWORD_INICIAL,
                "newPassword", PASSWORD_NUEVA
        );

        mockMvc.perform(put("/api/users/me/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message", is("Contraseña actualizada exitosamente")));

        // Login con la NUEVA contraseña → 200 con token
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", PASSWORD_EMAIL,
                                "password", PASSWORD_NUEVA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andReturn();

        String nuevoToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token").asText();
        assertNotEquals("", nuevoToken, "El login con la nueva contraseña debe emitir un JWT");

        // La contraseña ANTERIOR ya no sirve → 401
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", PASSWORD_EMAIL,
                                "password", PASSWORD_INICIAL))))
                .andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------------
    // 4) PUT /api/users/me/password con clave actual incorrecta → 400
    //    con ProblemDetail
    // ------------------------------------------------------------------
    @Test
    @DisplayName("PUT /api/users/me/password - Clave actual incorrecta responde 400 ProblemDetail")
    void shouldRejectWrongCurrentPassword() throws Exception {
        String token = registerAndReturnToken("Clave Incorrecta", PASSWORD_KO_EMAIL);

        Map<String, Object> request = Map.of(
                "currentPassword", "ClaveEquivocada999",
                "newPassword", PASSWORD_NUEVA
        );

        mockMvc.perform(put("/api/users/me/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title", is("Contraseña actual incorrecta")))
                .andExpect(jsonPath("$.detail", is("La contraseña actual no es correcta.")))
                .andExpect(jsonPath("$.type", is("https://lumina.demo/errors/invalid-current-password")));
    }

    // ------------------------------------------------------------------
    // 5) GET /api/users/me sin cabecera Authorization → 401 o 403
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/users/me - Sin token responde 401/403")
    void shouldRejectProfileWithoutToken() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(result -> {
                    int statusCode = result.getResponse().getStatus();
                    assertTrue(statusCode == 401 || statusCode == 403,
                            "Sin token debe responder 401 o 403, pero respondió " + statusCode);
                });
    }

    // ------------------------------------------------------------------
    // 6) El administrador también accede a su propio perfil (ROLE_ADMIN)
    // ------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/users/me - Un ROLE_ADMIN también consulta su perfil")
    void shouldAllowAdminToReadOwnProfile() throws Exception {
        String adminToken = loginAndReturnToken("admin@lumina.demo", "AdminLumina2026!");

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("admin@lumina.demo")))
                .andExpect(jsonPath("$.role", is("ROLE_ADMIN")));
    }

    // ------------------------------------------------------------------
    // 7) Validaciones: teléfono con formato inválido y clave nueva corta
    // ------------------------------------------------------------------
    @Test
    @DisplayName("PUT /api/users/me(/password) - Valida teléfono y longitud de nueva clave")
    void shouldValidateProfileInputs() throws Exception {
        String token = registerAndReturnToken("Datos Invalidos", VALIDACION_EMAIL);

        // Teléfono con letras → 400 de Bean Validation
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "Datos",
                                "lastName", "Invalidos",
                                "phone", "llamar-al-300"))))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title", is("Error de validación de datos")));

        // Nueva contraseña de 5 caracteres → 400
        mockMvc.perform(put("/api/users/me/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", PASSWORD_INICIAL,
                                "newPassword", "corta"))))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /** Registra un cliente de prueba y retorna su token JWT. */
    private String registerAndReturnToken(String fullName, String email) throws Exception {
        Map<String, Object> registerRequest = Map.of(
                "fullName", fullName,
                "email", email,
                "password", PASSWORD_INICIAL,
                "phone", "+573001112233"
        );

        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(registerResult.getResponse().getContentAsString())
                .get("token").asText();
    }

    /** Login genérico que devuelve el JWT emitido. */
    private String loginAndReturnToken(String email, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", password))))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token").asText();
    }
}
