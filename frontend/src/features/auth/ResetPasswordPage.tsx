import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword, verifyResetToken } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import './auth.css';

const PASSWORD_MIN_LENGTH = 8;

type LinkStatus = 'missing' | 'verifying' | 'valid' | 'invalid';

/**
 * Restablecimiento de contraseña (Fase 5E): valida el token del enlace al
 * montar y, si sigue vigente, permite definir la nueva clave. Al consumirse
 * el token deja de ser reutilizable (el backend responde 400).
 */
export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [linkStatus, setLinkStatus] = useState<LinkStatus>(token ? 'verifying' : 'missing');
  const [linkError, setLinkError] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLinkStatus('missing');
      return;
    }

    let cancelled = false;
    setLinkStatus('verifying');

    const verify = async () => {
      try {
        await verifyResetToken(token);
        if (!cancelled) {
          setLinkStatus('valid');
        }
      } catch (err) {
        if (!cancelled) {
          setLinkError(
            err instanceof Error
              ? err.message
              : 'El enlace de recuperación es inválido o ha expirado.'
          );
          setLinkStatus('invalid');
        }
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const isTooShort = newPassword.length > 0 && newPassword.length < PASSWORD_MIN_LENGTH;
  const doPasswordsMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const canSubmit =
    newPassword.length >= PASSWORD_MIN_LENGTH &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword &&
    !isLoading;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setSubmitError(null);
    setIsLoading(true);
    try {
      await resetPassword({ token, newPassword });
      setIsSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'No fue posible restablecer la contraseña.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="reset-password-title">
        <h1 id="reset-password-title" className="auth-card__title">
          Restablecer contraseña
        </h1>
        <p className="auth-card__subtitle">
          Define una nueva contraseña para tu cuenta. Debe tener al menos {PASSWORD_MIN_LENGTH}{' '}
          caracteres.
        </p>

        {isSuccess ? (
          <>
            <Alert
              variant="success"
              title="¡Contraseña restablecida!"
              style={{ marginTop: 'var(--space-6)' }}
            >
              ¡Tu contraseña ha sido restablecida con éxito! Ya puedes iniciar sesión con tu nueva
              clave.
            </Alert>
            <Button
              variant="primary"
              size="lg"
              className="auth-form__submit"
              style={{ marginTop: 'var(--space-6)' }}
              onClick={() => navigate('/cuenta/ingreso')}
            >
              Iniciar Sesión
            </Button>
          </>
        ) : linkStatus === 'missing' ? (
          <>
            <Alert
              variant="error"
              title="Enlace incompleto o inválido"
              style={{ marginTop: 'var(--space-6)' }}
            >
              Este enlace no incluye un token de recuperación. Solicita uno nuevo para continuar.
            </Alert>
            <Button
              variant="secondary"
              size="lg"
              className="auth-form__submit"
              style={{ marginTop: 'var(--space-4)' }}
              onClick={() => navigate('/cuenta/recuperar-password')}
            >
              Solicitar un nuevo enlace
            </Button>
          </>
        ) : linkStatus === 'invalid' ? (
          <>
            <Alert
              variant="error"
              title="No pudimos verificar el enlace"
              style={{ marginTop: 'var(--space-6)' }}
            >
              {linkError}
            </Alert>
            <Button
              variant="secondary"
              size="lg"
              className="auth-form__submit"
              style={{ marginTop: 'var(--space-4)' }}
              onClick={() => navigate('/cuenta/recuperar-password')}
            >
              Solicitar un nuevo enlace
            </Button>
          </>
        ) : linkStatus === 'verifying' ? (
          <div className="auth-loading" role="status">
            <span className="auth-loading__spinner" aria-hidden="true" />
            Verificando enlace...
          </div>
        ) : (
          <>
            {submitError && (
              <Alert
                variant="error"
                title="No pudimos restablecer la contraseña"
                style={{ marginTop: 'var(--space-4)' }}
              >
                {submitError}
              </Alert>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-form__field">
                <label htmlFor="reset-new-password" className="auth-form__label">
                  Nueva Contraseña
                </label>
                <input
                  id="reset-new-password"
                  name="newPassword"
                  type="password"
                  className="auth-form__input"
                  placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
                  autoComplete="new-password"
                  minLength={PASSWORD_MIN_LENGTH}
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={isLoading}
                />
                {isTooShort && (
                  <span className="auth-form__help auth-form__help--error">
                    La contraseña debe tener al menos {PASSWORD_MIN_LENGTH} caracteres.
                  </span>
                )}
              </div>

              <div className="auth-form__field">
                <label htmlFor="reset-confirm-password" className="auth-form__label">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type="password"
                  className="auth-form__input"
                  placeholder="Repite tu nueva contraseña"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isLoading}
                />
                {doPasswordsMismatch && (
                  <span className="auth-form__help auth-form__help--error">
                    Las contraseñas no coinciden.
                  </span>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="auth-form__submit"
                isLoading={isLoading}
                disabled={!canSubmit}
              >
                {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </Button>
            </form>
          </>
        )}

        <p className="auth-card__footer">
          <Link to="/cuenta/ingreso" className="auth-card__link">
            ← Volver a Iniciar Sesión
          </Link>
        </p>
      </section>
    </div>
  );
};
