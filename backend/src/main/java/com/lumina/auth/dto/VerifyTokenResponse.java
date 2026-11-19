package com.lumina.auth.dto;

/** Resultado de la verificación previa del token (GET /api/auth/verify-reset-token). */
public record VerifyTokenResponse(boolean valid, String message) {
}
