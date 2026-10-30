import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from '@/types/auth';
import type { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { login as loginApi, register as registerApi } from '@/lib/api/auth';

/**
 * Persistencia en localStorage (a diferencia del carrito que usa sessionStorage):
 * la sesión debe sobrevivir recargas Y cierres de pestaña, pues el usuario
 * no debería volver a iniciar sesión cada vez que entra a la tienda.
 * El token JWT se elimina al cerrar sesión (logout).
 */
const TOKEN_STORAGE_KEY = 'lumina_auth_token';
const USER_STORAGE_KEY = 'lumina_auth_user';

function loadStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage deshabilitado (ej. modo privado estricto) — sesión no persistente
    return null;
  }
}

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as User;
      if (typeof parsed?.id === 'number' && typeof parsed?.email === 'string') {
        return parsed;
      }
    }
  } catch {
    // JSON corrupto — limpiar para no dejar estado inválido
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // localStorage deshabilitado
    }
  }
  return null;
}

function toUser(response: AuthResponse): User {
  return {
    id: response.userId,
    email: response.email,
    fullName: response.fullName,
    role: response.role,
  };
}

interface AuthContextValue {
  /** Usuario autenticado o null si es invitado */
  user: User | null;
  /** Token JWT activo (para usar en 'Authorization: Bearer' en pedidos, Parte 3) */
  token: string | null;
  /** ¿Hay una sesión activa? */
  isAuthenticated: boolean;
  /** Autenticar un usuario existente */
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Crear cuenta y autenticar en un solo paso */
  register: (credentials: RegisterCredentials) => Promise<void>;
  /** Cerrar sesión y limpiar el almacenamiento */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado inicial leído de forma perezosa desde localStorage (evita flash de "invitado")
  const [token, setToken] = useState<string | null>(() => loadStoredToken());
  const [user, setUser] = useState<User | null>(() => loadStoredUser());

  // Mantener token y user sincronizados al reiniciar el estado en logout
  useEffect(() => {
    if (token === null) {
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {
        // localStorage deshabilitado
      }
    }
  }, [token]);

  // Limpieza antivirus de estado parcial (token sin user o viceversa)
  useEffect(() => {
    if ((token === null) !== (user === null)) {
      setUser(null);
      setToken(null);
    }
  }, [token, user]);

  // Acciones memorizadas para no re-crear funciones en cada render
  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await loginApi(credentials);
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(toUser(response)));
    } catch {
      // localStorage lleno o deshabilitado — la sesión solo vivirá en memoria
    }
    setToken(response.token);
    setUser(toUser(response));
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const response = await registerApi(credentials);
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(toUser(response)));
    } catch {
      // localStorage lleno o deshabilitado — la sesión solo vivirá en memoria
    }
    setToken(response.token);
    setUser(toUser(response));
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // localStorage deshabilitado
    }
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = useMemo(() => token !== null && user !== null, [token, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated,
      login,
      register,
      logout,
    }),
    [user, token, isAuthenticated, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook para consumir la sesión desde cualquier componente.
 *
 * Lanza error si se usa fuera del AuthProvider — intencional,
 * para detectar bugs durante el desarrollo.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      'useAuth() debe usarse dentro de un <AuthProvider>. ' +
      '¿Falta envolver la app con AuthProvider en MainLayout?'
    );
  }
  return context;
}
