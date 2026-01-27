import React, {
  createContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import { User, UserRole } from '../types';

interface RegisterPayload {
  nombre: string;
  apellido: string;
  rut: string;
  email: string;
  planta: string;
  password: string;
  rol: UserRole;
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  planta: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (rut: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* =========================
     REHIDRATAR SESIÓN
  ========================== */
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  /* =========================
     DERIVADOS
  ========================== */
  const role = useMemo<UserRole | null>(
    () => (user ? user.rol : null),
    [user]
  );
  const planta = useMemo(
    () => user?.planta ?? null,
    [user]
  );


  const isAuthenticated = useMemo(() => !!user, [user]);

  /* =========================
     LOGIN
  ========================== */
  const login = useCallback(async (rut: string, password: string) => {
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error de autenticación');
      }

      const loggedUser: User = {
        nombre: data.nombre,
        apellido: data.apellido,
        rut: data.rut,
        email: data.email,
        planta: data.planta,
        rol: data.rol,
      };

      setUser(loggedUser);
      localStorage.setItem('user', JSON.stringify(loggedUser));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* =========================
     REGISTER
  ========================== */
  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al registrar');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* =========================
     LOGOUT
  ========================== */
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);



  const value = useMemo(
    () => ({
      user,
      role,
      planta,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, role, planta, isAuthenticated, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
