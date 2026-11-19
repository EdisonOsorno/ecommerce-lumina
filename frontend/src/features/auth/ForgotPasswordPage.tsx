import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import './auth.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Recuperación de contraseña (Fase 5E): el usuario ingresa su correo y recibe
 * instrucciones. La respuesta del backend es neutra para no revelar si la
 * cuenta existe. En demo/desarrollo se muestra el enlace directo cuando el
 * backend devuelve `resetToken`.
 */
export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Ingresa un email válido.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await requestPasswordReset(trimmedEmail);
      setIsSubmitted(true);
      setResetToken(result.resetToken ?? null);
    } catch (err) {
      setIsSubmitted(false);
      setResetToken(null);
      setError(
        err instanceof Error ? err.message : 'Error inesperado al solicitar la recuperación.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    // Una nueva búsqueda invalida el resultado anterior (y su enlace demo)
    if (isSubmitted) {
      setIsSubmitted(false);
      setResetToken(null);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="forgot-password-title">
        <h1 id="forgot-password-title" className="auth-card__title">
          Recuperar contraseña
        </h1>
        <p className="auth-card__subtitle">
          Ingresa el correo electrónico asociado a tu cuenta para restablecer tu acceso.
        </p>

        {error && (
          <Alert
            variant="error"
            title="No pudimos enviar las instrucciones"
            style={{ marginTop: 'var(--space-4)' }}
          >
            {error}
          </Alert>
        )}

        {isSubmitted && (
          <Alert
            variant="success"
            title="Solicitud enviada"
            style={{ marginTop: 'var(--space-4)' }}
          >
            Si el correo está registrado, recibirás las instrucciones para restablecer tu contraseña.
          </Alert>
        )}

        {isSubmitted && resetToken && (
          <div className="auth-demo-box">
            <p>
              ✨ [Modo Demostración] Enlace generado:{' '}
              <Link
                to={`/cuenta/restablecer-password?token=${resetToken}`}
                className="auth-card__link"
              >
                Restablecer contraseña ahora
              </Link>
            </p>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form__field">
            <label htmlFor="forgot-email" className="auth-form__label">
              Email
            </label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              className="auth-form__input"
              placeholder="tu@email.com"
              autoComplete="email"
              required
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="auth-form__submit"
            isLoading={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
          </Button>
        </form>

        <p className="auth-card__footer">
          <Link to="/cuenta/ingreso" className="auth-card__link">
            ← Volver a Iniciar Sesión
          </Link>
        </p>
      </section>
    </div>
  );
};
