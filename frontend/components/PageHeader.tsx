import React, { useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeftIcon } from "./Icons";
import { Button } from "./ui/Button";
import { useNavigationBlocker } from "../context/NavigationBlockerContext";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmExit, shouldConfirmExit, blockNavigation } = useNavigationBlocker();
  const busyRef = useRef(false);

  const showBackButton = location.pathname !== "/";

  const handleSafeNavigate = useCallback(
    async (to: string | number) => {
      if (busyRef.current) return;
      busyRef.current = true;

      try {
        let confirmed = true;
        if (shouldConfirmExit()) {
          confirmed = await confirmExit();
          if (!confirmed) return;
          // ✅ Limpieza explícita para evitar “pegado” de bloqueo
          blockNavigation(false);
        }

        if (typeof to === "number") {
          // Si el formulario fue creado desde /forms/new, evita volver a esa ruta
          const cameFromNew = (location.state as any)?.fromNew === true;
          if (cameFromNew) {
            navigate("/");
          } else if (window.history.length > 2) {
            navigate(to);
          } else {
            navigate("/");
          }
        } else {
          navigate(to);
        }
      } finally {
        setTimeout(() => (busyRef.current = false), 150);
      }
    },
    [confirmExit, shouldConfirmExit, blockNavigation, navigate, location.state]
  );

  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="text-sm text-gray-500 mb-2" aria-label="breadcrumb">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={`${item.label}-${index}`}>
                {item.path && !isLast ? (
                  <button
                    type="button"
                    onClick={() => handleSafeNavigate(item.path!)}
                    className="hover:underline text-gray-600"
                    aria-label={`Ir a ${item.label}`}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
                )}
                {!isLast && <span className="mx-2">/</span>}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleSafeNavigate(-1)}
              aria-label="Volver"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-cku-blue">{title}</h1>
            {description && <p className="text-gray-600 mt-1">{description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-4">{children}</div>
      </div>
    </div>
  );
};
