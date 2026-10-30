package com.lumina.auth.service;

import com.lumina.auth.dto.AuthResponse;
import com.lumina.auth.dto.LoginRequest;
import com.lumina.auth.dto.RegisterRequest;
import com.lumina.auth.security.JwtService;
import com.lumina.shared.errors.EmailAlreadyExistsException;
import com.lumina.shared.errors.ResourceNotFoundException;
import com.lumina.users.domain.User;
import com.lumina.users.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Servicio de autenticación: registro de clientes y login con verificación BCrypt.
 * Las credenciales inválidas se traducen en AuthenticationException (manejada con HTTP 401).
 */
@Service
public class AuthService {

    private static final String DEFAULT_ROLE = "ROLE_CUSTOMER";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new EmailAlreadyExistsException("El email " + request.email() + " ya está registrado");
        }

        User user = new User();
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        String[] names = splitFullName(request.fullName());
        user.setFirstName(names[0]);
        user.setLastName(names[1]);

        user.setPhone(request.phone());
        user.setRole(DEFAULT_ROLE);
        user.setActive(true);

        User saved = userRepository.save(user);

        return buildResponse(saved, jwtService.generateToken(saved.getEmail(), saved.getRole()));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().trim().toLowerCase(), request.password())
        );

        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + request.email()));

        return buildResponse(user, jwtService.generateToken(user.getEmail(), user.getRole()));
    }

    private AuthResponse buildResponse(User user, String token) {
        String fullName = (user.getLastName() == null || user.getLastName().isBlank())
                ? user.getFirstName()
                : user.getFirstName() + " " + user.getLastName();
        return new AuthResponse(token, "Bearer", user.getId(), user.getEmail(), fullName, user.getRole());
    }

    /** Separa el nombre completo en [primer nombre, resto]. Si hay un solo término, lastName queda vacío. */
    private static String[] splitFullName(String fullName) {
        String trimmed = fullName.trim();
        int spaceIndex = trimmed.indexOf(' ');
        if (spaceIndex <= 0) {
            return new String[]{trimmed, ""};
        }
        return new String[]{trimmed.substring(0, spaceIndex), trimmed.substring(spaceIndex + 1).trim()};
    }
}
