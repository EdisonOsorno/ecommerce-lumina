package com.lumina.shared.errors;

/**
 * La contraseña actual enviada no coincide con la almacenada (BCrypt).
 * Se traduce en HTTP 400 con Problem Detail en GlobalExceptionHandler.
 */
public class InvalidCurrentPasswordException extends RuntimeException {

    public InvalidCurrentPasswordException() {
        super("La contraseña actual no es correcta.");
    }
}
