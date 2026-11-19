-- ==========================================================
-- V5: Tokens de recuperación de contraseña (un solo uso)
-- ==========================================================
-- Cada fila es una solicitud de restablecimiento: el token es único,
-- caduca en expires_at y se marca used = TRUE al consumirse. Al eliminar
-- un usuario sus tokens se borran en cascada (ON DELETE CASCADE).

CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(100) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
