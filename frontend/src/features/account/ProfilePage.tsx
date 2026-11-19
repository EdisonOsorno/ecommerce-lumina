import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock, Save } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { changePassword, getUserProfile, updateUserProfile } from '@/lib/api/user';
import type { UserProfile } from '@/types/user';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import './profile.css';

type Feedback = { type: 'success' | 'error'; message: string } | null;

/** Formato telefónico aceptado por el backend (7 a 30 caracteres). */
const PHONE_PATTERN = /^[0-9+() -]{7,30}$/;

/**
 * Mi Perfil (/cuenta/perfil, Fase 5D): datos personales editables y cambio
 * de contraseña con validación en vivo. Protegida: sin sesión redirige al
 * ingreso. Los cambios de nombre se reflejan de inmediato en la cabecera
 * mediante updateCurrentUser del AuthContext.
 */
export const ProfilePage: React.FC = () => {
  const { token, isAuthenticated, updateCurrentUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Tarjeta 1: datos personales
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);

  // Tarjeta 2: seguridad y contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

  // Carga inicial del perfil desde el backend
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getUserProfile(token)
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          setFirstName(data.firstName);
          setLastName(data.lastName);
          setPhone(data.phone ?? '');
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Error inesperado al cargar tu perfil.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Los mensajes de éxito se autodescartan; los de error permanecen visibles
  useEffect(() => {
    if (profileFeedback?.type !== 'success') {
      return;
    }
    const timer = setTimeout(() => setProfileFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [profileFeedback]);

  useEffect(() => {
    if (passwordFeedback?.type !== 'success') {
      return;
    }
    const timer = setTimeout(() => setPasswordFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [passwordFeedback]);

  // Protección de ruta: sin sesión no se renderiza el perfil
  if (!isAuthenticated) {
    return <Navigate to="/cuenta/ingreso" replace />;
  }

  if (isLoading) {
    return (
      <div className="container profile-page">
        <p className="profile-loading" role="status" aria-live="polite">
          Cargando tu perfil...
        </p>
      </div>
    );
  }

  // Validación en vivo de datos personales
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();
  const trimmedPhone = phone.trim();
  const isPhoneValid = trimmedPhone === '' || PHONE_PATTERN.test(trimmedPhone);
  const isProfileFormValid =
    trimmedFirstName.length > 0 && trimmedLastName.length > 0 && isPhoneValid;
  const hasProfileChanges =
    profile !== null &&
    (trimmedFirstName !== profile.firstName ||
      trimmedLastName !== profile.lastName ||
      trimmedPhone !== (profile.phone ?? ''));

  // Validación en vivo de la contraseña
  const isNewPasswordLongEnough = newPassword.length >= 8;
  const passwordsMatch = newPassword === confirmPassword;
  const isPasswordFormValid =
    currentPassword.trim().length > 0 && isNewPasswordLongEnough && passwordsMatch;

  const handleProfileSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !isProfileFormValid || !hasProfileChanges || profileSaving) {
      return;
    }
    setProfileSaving(true);
    setProfileFeedback(null);

    updateUserProfile(
      {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        phone: trimmedPhone === '' ? undefined : trimmedPhone,
      },
      token
    )
      .then((updated) => {
        setProfile(updated);
        setFirstName(updated.firstName);
        setLastName(updated.lastName);
        setPhone(updated.phone ?? '');
        updateCurrentUser({ firstName: updated.firstName, lastName: updated.lastName });
        setProfileFeedback({ type: 'success', message: 'Datos actualizados correctamente' });
      })
      .catch((err: unknown) => {
        setProfileFeedback({
          type: 'error',
          message: err instanceof Error ? err.message : 'Error inesperado al guardar tus datos.',
        });
      })
      .finally(() => {
        setProfileSaving(false);
      });
  };

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !isPasswordFormValid || passwordSaving) {
      return;
    }
    setPasswordSaving(true);
    setPasswordFeedback(null);

    changePassword({ currentPassword, newPassword }, token)
      .then(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordFeedback({ type: 'success', message: 'Contraseña actualizada exitosamente' });
      })
      .catch((err: unknown) => {
        setPasswordFeedback({
          type: 'error',
          message:
            err instanceof Error ? err.message : 'Error inesperado al actualizar tu contraseña.',
        });
      })
      .finally(() => {
        setPasswordSaving(false);
      });
  };

  return (
    <div className="container profile-page">
      <header className="profile-page__header">
        <h1 className="profile-page__title">Mi Perfil</h1>
        <p className="profile-page__subtitle">
          Gestiona tus datos personales y la seguridad de tu cuenta
        </p>
      </header>

      {loadError && (
        <Alert variant="error" title="No pudimos cargar tu perfil" style={{ marginBottom: 'var(--space-6)' }}>
          {loadError}
        </Alert>
      )}

      <div className="profile-grid">
        {/* ---------- Tarjeta 1: Datos personales ---------- */}
        <section className="profile-card" aria-labelledby="profile-data-title">
          <h2 id="profile-data-title" className="profile-card__title">
            Datos Personales
          </h2>

          {profileFeedback && (
            <Alert
              variant={profileFeedback.type === 'success' ? 'success' : 'error'}
              style={{ marginBottom: 'var(--space-4)' }}
            >
              {profileFeedback.message}
            </Alert>
          )}

          <form onSubmit={handleProfileSubmit} noValidate>
            <div className="profile-field">
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                className="profile-input"
                type="email"
                value={profile?.email ?? ''}
                disabled
                readOnly
              />
              <p className="profile-hint">
                El correo electrónico es tu identificador de cuenta y no se puede modificar.
              </p>
            </div>

            <div className="profile-field">
              <label htmlFor="profile-first-name">Nombre *</label>
              <input
                id="profile-first-name"
                className="profile-input"
                type="text"
                maxLength={100}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-last-name">Apellidos *</label>
              <input
                id="profile-last-name"
                className="profile-input"
                type="text"
                maxLength={100}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-phone">Teléfono (opcional)</label>
              <input
                id="profile-phone"
                className="profile-input"
                type="tel"
                placeholder="Ej.: 300 123 4567"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              {!isPhoneValid && (
                <p className="profile-field__error" role="alert">
                  Formato de teléfono no válido (7 a 30 caracteres: números, +, (), espacios o guiones).
                </p>
              )}
            </div>

            <div className="profile-card__actions">
              <Button
                variant="primary"
                type="submit"
                leftIcon={<Save size={16} />}
                isLoading={profileSaving}
                disabled={!isProfileFormValid || !hasProfileChanges}
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        </section>

        {/* ---------- Tarjeta 2: Seguridad y contraseña ---------- */}
        <section className="profile-card" aria-labelledby="profile-security-title">
          <h2 id="profile-security-title" className="profile-card__title">
            Seguridad y Contraseña
          </h2>

          {passwordFeedback && (
            <Alert
              variant={passwordFeedback.type === 'success' ? 'success' : 'error'}
              style={{ marginBottom: 'var(--space-4)' }}
            >
              {passwordFeedback.message}
            </Alert>
          )}

          <form onSubmit={handlePasswordSubmit} noValidate>
            <div className="profile-field">
              <label htmlFor="profile-current-password">Contraseña Actual *</label>
              <input
                id="profile-current-password"
                className="profile-input"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-new-password">Nueva Contraseña *</label>
              <input
                id="profile-new-password"
                className="profile-input"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
              <p className={`profile-hint ${newPassword.length > 0 && !isNewPasswordLongEnough ? 'profile-field__error' : ''}`}>
                Mínimo 8 caracteres.
              </p>
            </div>

            <div className="profile-field">
              <label htmlFor="profile-confirm-password">Confirmar Nueva Contraseña *</label>
              <input
                id="profile-confirm-password"
                className="profile-input"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="profile-field__error" role="alert">
                  Las contraseñas no coinciden.
                </p>
              )}
            </div>

            <div className="profile-card__actions">
              <Button
                variant="primary"
                type="submit"
                leftIcon={<Lock size={16} />}
                isLoading={passwordSaving}
                disabled={!isPasswordFormValid}
              >
                Actualizar Contraseña
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
