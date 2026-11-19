package com.lumina.auth.controller;

import com.lumina.auth.dto.AuthResponse;
import com.lumina.auth.dto.ForgotPasswordRequest;
import com.lumina.auth.dto.ForgotPasswordResponse;
import com.lumina.auth.dto.LoginRequest;
import com.lumina.auth.dto.RegisterRequest;
import com.lumina.auth.dto.ResetPasswordRequest;
import com.lumina.auth.dto.VerifyTokenResponse;
import com.lumina.auth.service.AuthService;
import com.lumina.auth.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Endpoints públicos de autenticación (securizados por regla en SecurityConfig).
 * Incluye el flujo de recuperación de contraseña (Fase 5E): solicitud,
 * verificación previa del token y restablecimiento de la clave.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** Solicita el enlace de recuperación (respuesta neutra anti-enumeración). */
    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(passwordResetService.requestPasswordReset(request));
    }

    /** Verifica que el token del enlace siga vigente antes de mostrar el formulario. */
    @GetMapping("/verify-reset-token")
    public ResponseEntity<VerifyTokenResponse> verifyResetToken(@RequestParam("token") String token) {
        return ResponseEntity.ok(passwordResetService.verifyResetToken(token));
    }

    /** Restablece la contraseña consumiendo el token (un solo uso). */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.ok(Map.of(
                "message", "Contraseña restablecida exitosamente. Ya puedes iniciar sesión."));
    }
}
