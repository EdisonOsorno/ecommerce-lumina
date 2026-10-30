package com.lumina.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Solicitud de registro de un nuevo cliente.
 * El nombre completo se divide en firstName/lastName al persistir
 * (la tabla users mantiene esas dos columnas).
 */
public record RegisterRequest(
        @NotBlank(message = "El nombre completo es obligatorio")
        String fullName,

        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no tiene un formato válido")
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
        String password,

        String phone
) {
}
