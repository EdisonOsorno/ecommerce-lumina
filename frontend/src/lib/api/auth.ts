import type { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/auth';

const API_BASE_URL = '/api/auth';

/**
 * Extrae el mensaje legible de una respuesta de error del backend.
 * El backend responde con Problem Detail (RFC 7807): { title, detail, ... }.
 * Si el body no es JSON válido, retrocede a un mensaje genérico con el código HTTP.
 */
async function extractErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === 'object') {
      const problem = data as { detail?: unknown; message?: unknown; title?: unknown };
      const detail = typeof problem.detail === 'string' ? problem.detail : undefined;
      const message = typeof problem.message === 'string' ? problem.message : undefined;
      const title = typeof problem.title === 'string' ? problem.title : undefined;
      return detail ?? message ?? title ?? fallbackMessage;
    }
  } catch {
    // El body no es JSON (ej. respuesta vacía o HTML de error) — usar el fallback
  }
  return `${fallbackMessage} (HTTP ${response.status})`;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'No fue posible iniciar sesión.'));
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
    throw new Error(await extractErrorMessage(response, 'No fue posible crear la cuenta.'));
  }
  return response.json();
}
