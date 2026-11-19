package com.lumina.auth.repository;

import com.lumina.auth.domain.PasswordResetToken;
import com.lumina.users.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    /** Tokens aún no consumidos del usuario (para invalidarlos al generar uno nuevo). */
    List<PasswordResetToken> findAllByUserAndUsedFalse(User user);
}
