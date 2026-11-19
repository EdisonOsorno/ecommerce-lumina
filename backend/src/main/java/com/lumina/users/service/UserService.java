package com.lumina.users.service;

import com.lumina.shared.errors.InvalidCurrentPasswordException;
import com.lumina.shared.errors.ResourceNotFoundException;
import com.lumina.users.domain.User;
import com.lumina.users.dto.ChangePasswordRequest;
import com.lumina.users.dto.UpdateProfileRequest;
import com.lumina.users.dto.UserProfileResponse;
import com.lumina.users.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Gestión del perfil del usuario autenticado (cliente o administrador):
 * consulta de datos personales, actualización de nombre/apellido/teléfono
 * y cambio de contraseña con verificación BCrypt de la clave actual.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        return toResponse(findUser(email));
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = findUser(email);
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setPhone(normalizePhone(request.phone()));
        return toResponse(userRepository.save(user));
    }

    /**
     * Verifica la contraseña actual contra el hash BCrypt almacenado y, si
     * coincide, guarda el hash de la nueva. La clave actual incorrecta se
     * traduce en HTTP 400 (InvalidCurrentPasswordException).
     */
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = findUser(email);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new InvalidCurrentPasswordException();
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    /** Búsqueda insensible a mayúsculas por email (misma convención de AuthService). */
    private User findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    /** Teléfono opcional: se normaliza vacío/espacios a null para no ensuciar la BD. */
    private static String normalizePhone(String phone) {
        return phone == null || phone.isBlank() ? null : phone.trim();
    }

    private static UserProfileResponse toResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
