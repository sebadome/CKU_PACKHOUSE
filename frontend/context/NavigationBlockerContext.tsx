// context/NavigationBlockerContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";

interface NavigationBlockerContextType {
  /** Marca si hay cambios sin guardar */
  blockNavigation: (block: boolean) => void;
  /** Flag público para UI (ej. mostrar “Cambios sin guardar”) */
  isNavigationBlocked: boolean;
  /** Abre modal y resuelve true/false según decisión del usuario */
  confirmExit: () => Promise<boolean>;
  /** Atajo para consultar si debe confirmarse la salida */
  shouldConfirmExit: () => boolean;
  /** Envuelve una acción potencialmente navegacional con confirmación segura */
  withSafeNavigation: <T extends (...args: any[]) => any>(
    fn: T
  ) => (...args: Parameters<T>) => Promise<void>;
}

const NavigationBlockerContext = createContext<NavigationBlockerContextType | undefined>(undefined);

export const useNavigationBlocker = (): NavigationBlockerContextType => {
  const ctx = useContext(NavigationBlockerContext);
  if (!ctx) throw new Error("useNavigationBlocker must be used within a NavigationBlockerProvider");
  return ctx;
};

type ConfirmState = { isOpen: boolean };

export const NavigationBlockerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>({ isOpen: false });

  // Guardamos la promesa pendiente y su resolve en refs para evitar renders innecesarios
  const pendingPromiseRef = useRef<Promise<boolean> | null>(null);
  const resolveRef = useRef<((val: boolean) => void) | null>(null);

  /** Marca si hay cambios sin guardar */
  const blockNavigation = useCallback((block: boolean) => {
    setIsBlocked(block);
  }, []);

  const shouldConfirmExit = useCallback(() => isBlocked, [isBlocked]);

  /** Abre modal y devuelve promesa con decisión del usuario */
  const confirmExit = useCallback((): Promise<boolean> => {
    // Si no hay cambios, se puede salir sin preguntar
    if (!isBlocked) return Promise.resolve(true);

    // Si ya hay un diálogo abierto, devuelve la misma promesa pendiente
    if (pendingPromiseRef.current) return pendingPromiseRef.current;

    // Crear una nueva promesa y guardar su resolve
    const promise = new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setConfirmState({ isOpen: true });
    });

    pendingPromiseRef.current = promise;
    return promise;
  }, [isBlocked]);

  /** Cerrar el diálogo (sin resolver) */
  const closeDialog = useCallback(() => {
    setConfirmState({ isOpen: false });
  }, []);

  /** Confirmar salida */
  const handleConfirm = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(true);
      // Al confirmar, desbloqueamos navegación
      setIsBlocked(false);
    }
    resolveRef.current = null;
    pendingPromiseRef.current = null;
    closeDialog();
  }, [closeDialog]);

  /** Cancelar salida */
  const handleClose = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false);
    }
    resolveRef.current = null;
    pendingPromiseRef.current = null;
    closeDialog();
  }, [closeDialog]);

  /** Limpieza por cierre de pestaña o reload */
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!isBlocked) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isBlocked]);

  /** Helper que envuelve funciones de navegación seguras */
  const withSafeNavigation = useCallback<NavigationBlockerContextType["withSafeNavigation"]>(
    (fn) => {
      return async (...args) => {
        const ok = await confirmExit();
        if (!ok) return;
        await Promise.resolve(fn(...args));
      };
    },
    [confirmExit]
  );

  const value = useMemo<NavigationBlockerContextType>(
    () => ({
      blockNavigation,
      isNavigationBlocked: isBlocked,
      confirmExit,
      shouldConfirmExit,
      withSafeNavigation,
    }),
    [blockNavigation, isBlocked, confirmExit, shouldConfirmExit, withSafeNavigation]
  );

  return (
    <NavigationBlockerContext.Provider value={value}>
      {children}

      {confirmState.isOpen && (
        <ConfirmDialog
          isOpen={true}
          title="Salir sin guardar"
          message="Tienes cambios sin guardar. Si sales ahora, se perderán. ¿Deseas salir igualmente?"
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      )}
    </NavigationBlockerContext.Provider>
  );
};