package com.lumina.users.dto;

import java.time.Instant;

/**
 * Perfil del usuario autenticado (GET/PUT /api/users/me).
 * No expone el hash de la contraseña ni campos internos.
 */
public record UserProfileResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String phone,
        String role,
        Instant createdAt) {
}
