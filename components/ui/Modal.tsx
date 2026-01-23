import React, { useEffect, useCallback, useRef, useId } from "react";
import { XCircleIcon } from "../Icons";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";

// FIX: Allow standard HTML div attributes to be passed down for accessibility (e.g., role, aria-describedby).
// Omit 'title' to avoid conflict with the component's own 'title' prop.
interface ModalProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closeOnOverlayClick?: boolean;
  enableEscClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  closeOnOverlayClick = true,
  enableEscClose = true,
  ...props
}) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  // FIX: Use the `useId` hook for a stable, unique ID for accessibility.
  const titleId = useId();

  // Cerrar con ESC
  const handleKeyDownGlobal = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (enableEscClose && e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [enableEscClose, isOpen, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDownGlobal);
    return () => window.removeEventListener("keydown", handleKeyDownGlobal);
  }, [isOpen, handleKeyDownGlobal]);

  // Bloquear scroll del body mientras el modal esté abierto
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Enfocar el primer elemento focuseable (o el botón cerrar) al abrir
  useEffect(() => {
    if (!isOpen) return;

    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables && focusables.length > 0) {
      // Busca el primer foco válido (preferimos contenido antes del botón cerrar)
      const first = (Array.from(focusables) as HTMLElement[]).find((el) => !el.hasAttribute("disabled")) ?? closeBtnRef.current;
      first?.focus();
    } else {
      closeBtnRef.current?.focus();
    }
  }, [isOpen]);

  // Trap de tabulación dentro del modal
  const handleKeyDownLocal = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;

    const list = (Array.from(focusables) as HTMLElement[]).filter((el) => !el.hasAttribute("disabled"));
    const first = list[0];
    const last = list[list.length - 1];

    if (e.shiftKey) {
      // Shift+Tab en el primero → ir al último
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab en el último → ir al primero
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={closeOnOverlayClick ? onClose : undefined}
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDownLocal}
      {...props}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="rounded-2xl shadow-2xl border border-gray-200 bg-white">
          <CardHeader className="flex items-center justify-between">
            <CardTitle id={titleId} className="text-gray-900">
              {title}
            </CardTitle>
            <button
              type="button"
              onClick={onClose}
              ref={closeBtnRef}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Cerrar modal"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
};