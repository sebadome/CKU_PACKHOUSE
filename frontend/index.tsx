
import React from 'react';

import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { GlobalSettingsProvider } from './context/GlobalSettingsContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <GlobalSettingsProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </GlobalSettingsProvider>
    </AuthProvider>
  </React.StrictMode>
);
