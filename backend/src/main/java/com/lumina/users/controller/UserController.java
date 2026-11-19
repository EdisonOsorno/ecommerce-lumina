package com.lumina.users.controller;

import com.lumina.users.dto.ChangePasswordRequest;
import com.lumina.users.dto.UpdateProfileRequest;
import com.lumina.users.dto.UserProfileResponse;
import com.lumina.users.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Perfil del usuario autenticado (Fase 5D), bajo /api/users/me.
 * Cualquier rol autenticado (ROLE_CUSTOMER o ROLE_ADMIN) puede consultar y
 * actualizar su propio perfil: la regla .anyRequest().authenticated() de
 * SecurityConfig protege /api/users/** (sin token → rechazo automático).
 * El email del usuario sale del principal cargado por el filtro JWT.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /** Datos personales del usuario autenticado. */
    @GetMapping("/me")
    public UserProfileResponse getProfile(Authentication authentication) {
        return userService.getProfile(authentication.getName());
    }

    /** Actualiza nombre, apellido y teléfono del usuario autenticado. */
    @PutMapping("/me")
    public UserProfileResponse updateProfile(Authentication authentication,
                                             @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(authentication.getName(), request);
    }

    /** Cambia la contraseña verificando primero la actual (BCrypt). */
    @PutMapping("/me/password")
    public Map<String, String> changePassword(Authentication authentication,
                                              @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(authentication.getName(), request);
        return Map.of("message", "Contraseña actualizada exitosamente");
    }
}
