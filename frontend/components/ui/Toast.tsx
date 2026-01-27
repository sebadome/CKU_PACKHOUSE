
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { CheckCircle2Icon, XCircleIcon, AlertTriangleIcon } from '../Icons';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning';
  duration?: number;          // ms hasta auto-cierre
  onDismiss: () => void;      // callback al cerrar
}

const toastConfig = {
  success: {
    icon: <CheckCircle2Icon className="h-5 w-5 text-green-500" />,
    style: 'border-green-500',
    ariaRole: 'status' as const,
    ariaLive: 'polite' as const,
  },
  error: {
    icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
    style: 'border-red-500',
    ariaRole: 'alert' as const,
    ariaLive: 'assertive' as const,
  },
  warning: {
    icon: <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />,
    style: 'border-yellow-500',
    ariaRole: 'alert' as const,
    ariaLive: 'assertive' as const,
  },
};

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  duration = 3000,
  onDismiss,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const remainingRef = useRef<number>(duration);

  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const cfg = toastConfig[type];

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const schedule = useCallback((ms: number) => {
    clearTimer();
    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(() => {
      setIsFadingOut(true);
      // espera la animación antes de avisar el dismiss
      window.setTimeout(onDismiss, prefersReducedMotion ? 0 : 300);
    }, ms) as unknown as number;
  }, [onDismiss, prefersReducedMotion]);

  // Arranque
  useEffect(() => {
    remainingRef.current = duration;
    schedule(duration);
    return clearTimer;
  }, [duration, schedule]);

  // Pausa en hover/focus
  const handlePause = () => {
    if (isPaused) return;
    setIsPaused(true);
    if (startedAtRef.current) {
      const elapsed = Date.now() - startedAtRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    }
    clearTimer();
  };

  const handleResume = () => {
    if (!isPaused) return;
    setIsPaused(false);
    schedule(Math.max(0, remainingRef.current));
  };

  return (
    <div
      role={cfg.ariaRole}
      aria-live={cfg.ariaLive}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocus={handlePause}
      onBlur={handleResume}
      className={[
        'w-full bg-white rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
        'border-l-4 p-4',
        cfg.style,
        prefersReducedMotion
          ? ''
          : `transition-all duration-300 ${isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`
      ].join(' ')}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5" aria-hidden="true">{cfg.icon}</div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-gray-900">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsFadingOut(true);
            window.setTimeout(onDismiss, prefersReducedMotion ? 0 : 200);
          }}
          className="ml-3 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cku-blue rounded"
          aria-label="Cerrar notificación"
        >
          <XCircleIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
