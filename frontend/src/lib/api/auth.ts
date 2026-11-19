import type { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { extractProblemDetailMessage } from '@/lib/api/problemDetail';

const API_BASE_URL = '/api/auth';

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(await extractProblemDetailMessage(response, 'No fue posible iniciar sesión.'));
  }
  return response.json();
}

export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(await extractProblemDetailMessage(response, 'No fue posible crear la cuenta.'));
  }
  return response.json();
}

/**
 * Solicita el enlace de recuperación de contraseña.
 * La respuesta es neutra (exista o no la cuenta); `resetToken` solo llega en
 * entorno de demo/desarrollo para facilitar las pruebas del flujo completo.
 */
export async function requestPasswordReset(
  email: string
): Promise<{ message: string; resetToken?: string | null }> {
  const response = await fetch(`${API_BASE_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error(
      await extractProblemDetailMessage(response, 'No fue posible procesar la solicitud.')
    );
  }
  return response.json();
}

/**
 * Verifica que el token del enlace siga vigente antes de mostrar el formulario.
 * Un 400 (inexistente, expirado o consumido) llega como Problem Detail y se
 * propaga como Error con el mensaje del backend.
 */
export async function verifyResetToken(
  token: string
): Promise<{ valid: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/verify-reset-token?token=${encodeURIComponent(token)}`
  );

  if (!response.ok) {
    throw new Error(
      await extractProblemDetailMessage(
        response,
        'El enlace de recuperación es inválido o ha expirado.'
      )
    );
  }
  return response.json();
}

/** Restablece la contraseña consumiendo el token de un solo uso. */
export async function resetPassword(payload: {
  token: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await extractProblemDetailMessage(response, 'No fue posible restablecer la contraseña.')
    );
  }
  return response.json();
}
