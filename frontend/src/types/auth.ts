export interface User {
  /** ID del usuario (del backend) */
  id: number;
  /** Email con el que se autenticó (normalizado en minúsculas por el backend) */
  email: string;
  /** Nombre completo registrado */
  fullName: string;
  /** Rol de Spring Security (ej. ROLE_CUSTOMER) */
  role: string;
}

export interface AuthResponse {
  /** JWT firmado (HMAC-SHA256) para enviar como 'Authorization: Bearer <token>' */
  token: string;
  /** Tipo de token ("Bearer") */
  tokenType: string;
  /** ID del usuario autenticado */
  userId: number;
  /** Email del usuario autenticado */
  email: string;
  /** Nombre completo del usuario */
  fullName: string;
  /** Rol de Spring Security */
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}
