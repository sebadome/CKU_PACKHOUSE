
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface GlobalSettingsContextType {
  planta: string;
  setPlanta: (planta: string) => void;
  temporada: string;
  setTemporada: (temporada: string) => void;
  getFormattedPlanta: () => string; // Helper para formatear 'teno' a 'Teno'
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

export const useGlobalSettings = () => {
  const context = useContext(GlobalSettingsContext);
  if (!context) {
    throw new Error('useGlobalSettings must be used within a GlobalSettingsProvider');
  }
  return context;
};

export const GlobalSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [planta, setPlanta] = useState<string>('teno'); // Valor por defecto
  const [temporada, setTemporada] = useState<string>('24-25');

  // Convierte "san_felipe" -> "San Felipe", "teno" -> "Teno"
  const getFormattedPlanta = () => {
    if (!planta) return '';
    return planta
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <GlobalSettingsContext.Provider value={{ planta, setPlanta, temporada, setTemporada, getFormattedPlanta }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
};
