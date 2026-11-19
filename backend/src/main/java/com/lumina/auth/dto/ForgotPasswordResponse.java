package com.lumina.auth.dto;

/**
 * Respuesta neutra de recuperación de contraseña: el mismo mensaje exista o
 * no la cuenta (anti-enumeración). resetToken solo se expone en entorno de
 * demo/desarrollo para facilitar pruebas directas y automatizadas.
 */
public record ForgotPasswordResponse(String message, String resetToken) {
}
