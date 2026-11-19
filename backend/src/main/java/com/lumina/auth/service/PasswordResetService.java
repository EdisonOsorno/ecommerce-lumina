package com.lumina.auth.service;

import com.lumina.auth.domain.PasswordResetToken;
import com.lumina.auth.dto.ForgotPasswordRequest;
import com.lumina.auth.dto.ForgotPasswordResponse;
import com.lumina.auth.dto.ResetPasswordRequest;
import com.lumina.auth.dto.VerifyTokenResponse;
import com.lumina.auth.repository.PasswordResetTokenRepository;
import com.lumina.shared.errors.InvalidResetTokenException;
import com.lumina.users.domain.User;
import com.lumina.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Recuperación de contraseña (Fase 5E): generación de tokens de un solo uso,
 * verificación previa del enlace y restablecimiento de la clave.
 *
 * Anti-enumeración: "olvidé mi contraseña" responde idéntico exista o no la
 * cuenta; el resetToken solo se incluye en la respuesta para demo/pruebas,
 * mientras que el canal real es el log INFO con el enlace del frontend.
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    /** Vigencia del enlace: 15 minutos desde su generación. */
    private static final long TOKEN_TTL_MINUTES = 15;

    private static final String NEUTRAL_MESSAGE =
            "Si el correo está registrado, recibirás las instrucciones para restablecer tu contraseña.";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository passwordResetTokenRepository,
                                PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Solicita un enlace de recuperación. Si la cuenta existe, invalida los
     * tokens previos sin consumir, crea uno nuevo (UUID) con TTL de 15 minutos
     * y registra el enlace en el log. Si no existe, responde igual pero sin token.
     */
    @Transactional
    public ForgotPasswordResponse requestPasswordReset(ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(request.email());
        if (userOpt.isEmpty()) {
            // Sin 404 ni pistas: misma respuesta que una cuenta existente
            return new ForgotPasswordResponse(NEUTRAL_MESSAGE, null);
        }

        User user = userOpt.get();

        // Un solo enlace vigente por usuario: invalida los anteriores
        List<PasswordResetToken> previousTokens =
                passwordResetTokenRepository.findAllByUserAndUsedFalse(user);
        previousTokens.forEach(previous -> previous.setUsed(true));
        passwordResetTokenRepository.saveAll(previousTokens);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setToken(UUID.randomUUID().toString());
        resetToken.setExpiresAt(Instant.now().plus(TOKEN_TTL_MINUTES, ChronoUnit.MINUTES));
        passwordResetTokenRepository.save(resetToken);

        log.info("🔑 ENLACE DE RECUPERACIÓN GENERADO para {}: http://localhost:5173/cuenta/restablecer-password?token={}",
                user.getEmail(), resetToken.getToken());

        return new ForgotPasswordResponse(NEUTRAL_MESSAGE, resetToken.getToken());
    }

    /** Valida el token del enlace antes de mostrar el formulario de nueva clave. */
    @Transactional(readOnly = true)
    public VerifyTokenResponse verifyResetToken(String token) {
        passwordResetTokenRepository.findByToken(token)
                .filter(PasswordResetToken::isValid)
                .orElseThrow(InvalidResetTokenException::new);
        return new VerifyTokenResponse(true, "Token válido");
    }

    /**
     * Restablece la contraseña con un token válido y lo marca como consumido
     * (un solo uso). El login posterior usa la nueva clave.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token())
                .filter(PasswordResetToken::isValid)
                .orElseThrow(InvalidResetTokenException::new);

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }
}
