
import React, { createContext, useState, useMemo, useCallback } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (rut: string, pass: string) => Promise<void>;
  logout: () => void;
  // setRole se elimina porque el rol depende del usuario logueado, no de una selección manual
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // El rol actual se deriva del primer rol del usuario logueado
  const role = useMemo(() => user?.roles[0] || null, [user]);
  const isAuthenticated = useMemo(() => !!user, [user]);

  const login = useCallback(async (rutInput: string, passInput: string) => {
    setIsLoading(true);
    
    // SIMULACIÓN DE BACKEND SQL
    // Aquí iría la llamada a la API: await api.post('/login', { rut, pass })
    
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        // Normalización de entradas para evitar errores por espacios o formato
        const rut = rutInput.trim();
        const pass = passInput.trim();
        const cleanRut = rut.replace(/\./g, ''); // Permitir RUT sin puntos (ej: 11111111-1)

        // Lógica Mock Hardcodeada
        // Admin: 11.111.111-1
        if ((rut === '11.111.111-1' || cleanRut === '11111111-1') && pass === 'Test1234!') {
           setUser({
             name: 'Administrador Sistema',
             roles: ['Administrador']
           });
           resolve();
        } 
        // Trabajador: 22.222.222-2
        else if ((rut === '22.222.222-2' || cleanRut === '22222222-2') && pass === 'Test1234!') {
           setUser({
             name: 'Trabajador Planta',
             roles: ['Trabajador CKU']
           });
           resolve();
        } else {
           reject(new Error('Credenciales inválidas'));
        }
        setIsLoading(false);
      }, 800); // Simular delay de red
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    role,
    isAuthenticated,
    isLoading,
    login,
    logout
  }), [user, role, isAuthenticated, isLoading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
