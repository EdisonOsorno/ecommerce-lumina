package com.lumina.shared.errors;

/**
 * Token de recuperación inexistente, expirado o ya consumido.
 * Se traduce en HTTP 400 con Problem Detail en GlobalExceptionHandler.
 */
public class InvalidResetTokenException extends RuntimeException {

    public InvalidResetTokenException() {
        super("El enlace de recuperación es inválido o ha expirado. Por favor solicita uno nuevo.");
    }
}
