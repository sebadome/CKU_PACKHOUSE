
import React, { useEffect, useRef, useState, useId } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { AlertTriangleIcon } from "./Icons";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;      // cancelar / permanecer
  onConfirm: () => void;    // confirmar acción
  title: string;
  message: string;
  confirmText?: string;     // Texto personalizado para el botón
  submittingText?: string;  // Texto durante la acción
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Salir sin guardar",
  submittingText = "Saliendo...",
}) => {
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const pressedOnceRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const descriptionId = useId();

  // Enfoca el botón de confirmar al abrir
  useEffect(() => {
    if (isOpen) {
      pressedOnceRef.current = false;
      setIsSubmitting(false);
      const t = setTimeout(() => confirmRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Atajo: Enter = Confirmar (evita dobles disparos)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

      // evita confirmar si el foco está en un elemento interactivo distinto (p.ej. Cancelar)
      const active = document.activeElement as HTMLElement | null;
      const tag = (active?.tagName || "").toUpperCase();
      const isTyping =
        tag === "INPUT" || tag === "TEXTAREA" || (active?.getAttribute("contenteditable") === "true");
      if (isTyping) return;

      if (!pressedOnceRef.current) {
        e.preventDefault();
        pressedOnceRef.current = true;
        setIsSubmitting(true);
        onConfirm();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onConfirm]);

  // Limpieza de scroll al abrir/cerrar
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    pressedOnceRef.current = false;
    setIsSubmitting(false);
    onClose();
  };

  const handleConfirmClick = () => {
    if (pressedOnceRef.current) return;
    pressedOnceRef.current = true;
    setIsSubmitting(true);
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      closeOnOverlayClick
      enableEscClose
      // Aria hints para lectores de pantalla (si Modal los utiliza internamente)
      role="alertdialog"
      aria-describedby={descriptionId}
    >
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-start space-x-3">
          <AlertTriangleIcon className="h-6 w-6 text-cku-red flex-shrink-0" />
          <p id={descriptionId} className="text-sm text-gray-600">
            {message}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmClick}
            ref={confirmRef}
            disabled={isSubmitting}
          >
            {isSubmitting ? submittingText : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
