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
