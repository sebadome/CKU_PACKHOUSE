
import React, { useState, useEffect, useContext, useCallback } from "react";
import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import FormFiller from "./pages/FormFiller";
import TemplateBuilder from "./pages/TemplateBuilder";
import RecordsLibrary from "./pages/ReviewDashboard";
import Drafts from "./pages/Drafts";
import Admin from "./pages/Admin";
import Library from "./pages/Library";
import Login from "./pages/Login";
import { FormTemplate, FormSubmission, UserRole } from "./types";
import { MOCK_TEMPLATES, MOCK_SUBMISSIONS } from "./constants";
import Layout from "./components/Layout";
import { AuthContext, AuthProvider } from "./context/AuthContext"; // Ensure AuthProvider is imported
import { v4 as uuidv4 } from "uuid";
import { NavigationBlockerProvider } from "./context/NavigationBlockerContext";
import { ToastProvider } from "./context/ToastContext";
import { GlobalSettingsProvider } from "./context/GlobalSettingsContext";
import _ from 'lodash';
import Registro from "./pages/Register"
import AuthLanding from "./pages/authlanding";

// Wrapper component to handle Auth logic cleanly
const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);

  // Load mocks only once on mount
  useEffect(() => {
    setTemplates(MOCK_TEMPLATES);
    setSubmissions(MOCK_SUBMISSIONS);
  }, []);

  const findTemplate = useCallback(
    (id: string): FormTemplate | undefined => templates.find((t) => t.id === id),
    [templates]
  );

  const findSubmission = useCallback(
    (id: string): FormSubmission | undefined => submissions.find((s) => s.id === id),
    [submissions]
  );

  const initializeSubmission = useCallback(
    (templateId: string): FormSubmission => {
      const newSubmission: FormSubmission = {
        id: uuidv4(),
        templateId,
        status: "Borrador",
        data: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        submittedBy: user?.name || "Usuario (CKU)", 
      };
      return newSubmission;
    },
    [user?.name]
  );

  const saveSubmission = useCallback((submission: FormSubmission) => {
    setSubmissions((prev) => {
      const exists = prev.some((s) => s.id === submission.id);
      return exists 
        ? prev.map((s) => (s.id === submission.id ? submission : s)) 
        : [...prev, submission];
    });
  }, []);

  const deleteSubmission = useCallback((id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateTemplate = useCallback((updated: FormTemplate) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === updated.id);
      return exists ? prev.map((t) => (t.id === updated.id ? updated : t)) : [...prev, updated];
    });
  }, []);

   // Si no está autenticado, mostramos Login exclusivamente
 if (!isAuthenticated) {
  return (
    <Routes>
      <Route path="/" element={<AuthLanding />} />
      <Route path="/login" element={<Login />} />
     { <Route path="/registro" element={<Registro />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

  // Rutas protegidas por Rol
  const ProtectedRoute: React.FC<{ allowedRoles: UserRole[] }> = ({ allowedRoles }) => {
    const { role } = useContext(AuthContext);
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
    return <Outlet />;
  };

  return (
    <NavigationBlockerProvider>
      <Routes>
        <Route element={<Layout />}>
          {/* Público (dentro de la app logueada) */}
          <Route path="/" element={<Home templates={templates} submissions={submissions} />} />

          {/* Llenado (solo Trabajador CKU / Admin) */}
          <Route element={<ProtectedRoute allowedRoles={["Trabajador CKU", "Administrador"]} />}>
            <Route
              path="/forms/new"
              element={
                <FormFiller
                  key="form-new"
                  findTemplate={findTemplate}
                  initializeSubmission={initializeSubmission}
                  findSubmission={findSubmission}
                  saveSubmission={saveSubmission}
                />
              }
            />
            <Route
              path="/forms/fill/:id"
              element={
                <FormFiller
                  key="form-fill"
                  findTemplate={findTemplate}
                  initializeSubmission={initializeSubmission}
                  findSubmission={findSubmission}
                  saveSubmission={saveSubmission}
                />
              }
            />

            {/* Borradores y Biblioteca */}
            <Route path="/drafts" element={<Drafts submissions={submissions} templates={templates} deleteSubmission={deleteSubmission} />} />
            <Route
              path="/library"
              element={
                <Library
                  submissions={submissions}
                  templates={templates}
                />
              }
            />
          </Route>

          {/* Admin: Biblioteca de Registros y Admin */}
          <Route element={<ProtectedRoute allowedRoles={["Administrador"]} />}>
            <Route
              path="/records"
              element={
                <RecordsLibrary
                  submissions={submissions}
                  templates={templates}
                />
              }
            />
            <Route
              path="/records/:id"
              element={
                <FormFiller
                  key="form-read-only"
                  findTemplate={findTemplate}
                  initializeSubmission={initializeSubmission}
                  findSubmission={findSubmission}
                  saveSubmission={saveSubmission}
                  isReadOnly={true}
                />
              }
            />
              <Route path="/admin" element={<Admin templates={templates} />} />
            <Route
              path="/admin/templates/new"
              element={<TemplateBuilder findTemplate={findTemplate} updateTemplate={updateTemplate} />}
            />
            <Route
              path="/admin/templates/:id"
              element={<TemplateBuilder findTemplate={findTemplate} updateTemplate={updateTemplate} />}
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </NavigationBlockerProvider>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <GlobalSettingsProvider>
          <ToastProvider>
             <AppContent />
          </ToastProvider>
        </GlobalSettingsProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
