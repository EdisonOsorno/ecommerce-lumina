import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import './auth.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Validaciones de frontend (el backend revalida TODO desde cero — never trust the client)
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (trimmedFullName.length < 2) {
      setError('Ingresa tu nombre completo.');
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Ingresa un email válido.');
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        fullName: trimmedFullName,
        email: trimmedEmail,
        password,
        phone: trimmedPhone === '' ? undefined : trimmedPhone,
      });
      navigate('/catalogo', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al crear la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <h1 id="register-title" className="auth-card__title">
          Crear cuenta
        </h1>
        <p className="auth-card__subtitle">
          Únete a Lúmina y descubre cosméticos seleccionados para ti.
        </p>

        {error && (
          <Alert
            variant="error"
            title="No pudimos crear tu cuenta"
            style={{ marginTop: 'var(--space-4)' }}
          >
            {error}
          </Alert>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form__field">
            <label htmlFor="register-full-name" className="auth-form__label">
              Nombre completo
            </label>
            <input
              id="register-full-name"
              name="fullName"
              type="text"
              className="auth-form__input"
              placeholder="Ana María Gómez"
              autoComplete="name"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="register-email" className="auth-form__label">
              Email
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              className="auth-form__input"
              placeholder="tu@email.com"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="register-password" className="auth-form__label">
              Contraseña
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              className="auth-form__input"
              placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="register-confirm-password" className="auth-form__label">
              Confirmar contraseña
            </label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              className="auth-form__input"
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="register-phone" className="auth-form__label">
              Teléfono <span className="auth-form__label--optional">(opcional)</span>
            </label>
            <input
              id="register-phone"
              name="phone"
              type="tel"
              className="auth-form__input"
              placeholder="+57 300 000 0000"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
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
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="auth-card__footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/cuenta/ingreso" className="auth-card__link">
            Inicia sesión aquí
          </Link>
        </p>
      </section>
    </div>
  );
};
