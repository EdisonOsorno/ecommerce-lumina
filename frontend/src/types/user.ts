/**
 * Tipos del perfil de usuario (Fase 5D), espejo de los DTOs del backend
 * en com.lumina.users.dto.
 */

/** Perfil completo del usuario autenticado (GET/PUT /api/users/me). */
export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

/** Cuerpo del PUT /api/users/me (UpdateProfileRequest). */
export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  phone?: string;
}

/** Cuerpo del PUT /api/users/me/password (ChangePasswordRequest). */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
