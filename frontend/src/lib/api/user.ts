import { extractProblemDetailMessage } from '@/lib/api/problemDetail';
import type { ChangePasswordPayload, UpdateProfilePayload, UserProfile } from '@/types/user';

const API_BASE_URL = '/api/users';

/**
 * Perfil del usuario autenticado (Fase 5D). Todas las funciones exigen el
 * JWT: /api/users/** está cubierto por anyRequest().authenticated() en el
 * backend, así que sin token la API responde rechazo (401/403).
 */

/** Datos personales del usuario autenticado. */
export async function getUserProfile(token: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(
      await extractProblemDetailMessage(response, 'No fue posible cargar tu perfil.')
    );
  }
  return response.json();
}

/** Actualiza nombre, apellido y teléfono del usuario autenticado. */
export async function updateUserProfile(
  payload: UpdateProfilePayload,
  token: string
): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(
      await extractProblemDetailMessage(response, 'No fue posible actualizar tus datos.')
    );
  }
  return response.json();
}

/**
 * Cambia la contraseña verificando la actual en el backend.
 * Contraseña actual incorrecta → 400 ProblemDetail (detail legible extraído aquí).
 */
export async function changePassword(
  payload: ChangePasswordPayload,
  token: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/me/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(
      await extractProblemDetailMessage(response, 'No fue posible actualizar tu contraseña.')
    );
  }
  return response.json();
}
