import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser, UserRole } from '../types';

interface StoredUser extends AuthUser {
  password: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  register: (input: RegisterInput) => { ok: true } | { ok: false; error: string };
  logout: () => void;
}

const STORAGE_USERS_KEY = 'kle-users';
const STORAGE_SESSION_KEY = 'kle-session';

const defaultUsers: StoredUser[] = [
  {
    id: 'usr-001',
    name: 'Cap. J. Rodriguez',
    email: 'analista@kle.local',
    password: 'demo1234',
    role: 'analista',
  },
  {
    id: 'usr-002',
    name: 'Autoridad Apoyada',
    email: 'autoridad@kle.local',
    password: 'demo1234',
    role: 'autoridad',
  },
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readUsers(): StoredUser[] {
  const raw = localStorage.getItem(STORAGE_USERS_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }

  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    return parsed.length > 0 ? parsed : defaultUsers;
  } catch {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

function sanitizeUser(user: StoredUser): AuthUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const users = readUsers();
    const sessionEmail = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!sessionEmail) return;

    const sessionUser = users.find((item) => item.email === sessionEmail);
    if (sessionUser) {
      setUser(sanitizeUser(sessionUser));
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: (email, password) => {
        const users = readUsers();
        const found = users.find(
          (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password
        );

        if (!found) {
          return { ok: false, error: 'Credenciales no validas.' };
        }

        const safeUser = sanitizeUser(found);
        localStorage.setItem(STORAGE_SESSION_KEY, safeUser.email);
        setUser(safeUser);
        return { ok: true };
      },
      register: ({ name, email, password, role }) => {
        const users = readUsers();
        const normalizedEmail = email.trim().toLowerCase();

        if (users.some((item) => item.email.toLowerCase() === normalizedEmail)) {
          return { ok: false, error: 'Ya existe un usuario con ese correo.' };
        }

        const newUser: StoredUser = {
          id: `usr-${Date.now()}`,
          name: name.trim(),
          email: normalizedEmail,
          password,
          role,
        };

        const nextUsers = [...users, newUser];
        writeUsers(nextUsers);
        const safeUser = sanitizeUser(newUser);
        localStorage.setItem(STORAGE_SESSION_KEY, safeUser.email);
        setUser(safeUser);
        return { ok: true };
      },
      logout: () => {
        localStorage.removeItem(STORAGE_SESSION_KEY);
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
