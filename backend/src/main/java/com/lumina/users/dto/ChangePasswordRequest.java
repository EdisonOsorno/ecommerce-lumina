package com.lumina.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Cambio de contraseña del usuario autenticado: exige la contraseña actual
 * para verificar identidad antes de fijar la nueva (mínimo 8 caracteres).
 */
public record ChangePasswordRequest(
        @NotBlank(message = "La contraseña actual es obligatoria")
        String currentPassword,

        @NotBlank(message = "La nueva contraseña es obligatoria")
        @Size(min = 8, max = 100, message = "La nueva contraseña debe tener al menos 8 caracteres")
        String newPassword) {
}
