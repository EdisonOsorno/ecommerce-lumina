import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import './auth.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Destino de retorno: la página que interrumpió el flujo o, en su defecto, el catálogo
  const from = (location.state as { from?: string } | null)?.from ?? '/catalogo';

  // Si ya está autenticado, no tiene sentido ver el formulario de ingreso
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

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
      await login({ email: trimmedEmail, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title" className="auth-card__title">
          Iniciar sesión
        </h1>
        <p className="auth-card__subtitle">
          Bienvenida de nuevo. Ingresa tus credenciales para continuar.
        </p>

        {error && (
          <Alert
            variant="error"
            title="No pudimos iniciar sesión"
            style={{ marginTop: 'var(--space-4)' }}
          >
            {error}
          </Alert>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form__field">
            <label htmlFor="login-email" className="auth-form__label">
              Email
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className="auth-form__label">
              Contraseña
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              className="auth-form__input"
              placeholder="Tu contraseña"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div
            style={{
              textAlign: 'right',
              marginTop: 'var(--space-1)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <Link
              to="/cuenta/recuperar-password"
              className="auth-card__link"
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="auth-form__submit"
            isLoading={isLoading}
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>

        <p className="auth-card__footer">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/cuenta/registro" className="auth-card__link">
            Regístrate aquí
          </Link>
        </p>
      </section>
    </div>
  );
};
