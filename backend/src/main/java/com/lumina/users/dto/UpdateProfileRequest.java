package com.lumina.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Actualización de los datos personales del usuario autenticado.
 * El teléfono es opcional (null o vacío permitidos); si viene, debe tener
 * un formato telefónico válido de 7 a 30 caracteres.
 */
public record UpdateProfileRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100)
        String firstName,

        @NotBlank(message = "El apellido es obligatorio")
        @Size(max = 100)
        String lastName,

        @Pattern(regexp = "^$|^[0-9+() -]{7,30}$", message = "Formato de teléfono no válido")
        String phone) {
}
