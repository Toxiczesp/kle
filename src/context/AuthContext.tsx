import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser, UserRole } from '../types';
import { apiRequest, postJson, setSessionToken } from '../lib/apiClient';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  register: (input: RegisterInput) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const { user: sessionUser } = await apiRequest<{ user: AuthUser }>('/api/auth/session');
        if (isMounted) {
          setUser(sessionUser);
        }
      } catch {
        if (isMounted) {
          setSessionToken(null);
          setUser(null);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: async (email, password) => {
        try {
          const result = await postJson<{ token: string; user: AuthUser }>('/api/auth/login', { email, password });
          setSessionToken(result.token);
          setUser(result.user);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : 'No se pudo iniciar sesión.',
          };
        }
      },
      register: async ({ name, email, password, role }) => {
        try {
          const result = await postJson<{ token: string; user: AuthUser }>('/api/auth/register', {
            name,
            email,
            password,
            role,
          });
          setSessionToken(result.token);
          setUser(result.user);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : 'No se pudo registrar el usuario.',
          };
        }
      },
      logout: () => {
        void postJson('/api/auth/logout', {});
        setSessionToken(null);
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
