
// context/ToastContext.tsx
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Toast, ToastProps } from '../components/ui/Toast';

type ToastKind = NonNullable<ToastProps['type']>;
type AddToastInput = {
  message: string;
  type?: ToastKind;
  duration?: number;
};

type ToastMessage = Omit<ToastProps, 'onDismiss'>;

interface ToastContextType {
  addToast: (toast: AddToastInput) => string;       // devuelve id del toast
  removeToast: (id: string) => void;                // útil para cerrar manualmente
  clearToasts: () => void;                          // limpiar todos
}

const MAX_TOASTS = 4;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback((toast: AddToastInput) => {
    const id = uuidv4();
    setToasts((prev) => {
      const next = [...prev, { ...toast, id }];
      // Mantener un máximo de N toasts (quita los más antiguos)
      if (next.length > MAX_TOASTS) next.splice(0, next.length - MAX_TOASTS);
      return next;
    });
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearToasts }}>
      {children}
      <div
        className="fixed top-4 left-4 right-4 sm:top-5 sm:right-5 sm:left-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
