import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect
} from 'react';

interface GlobalSettingsContextType {
  temporada: string;
  setTemporada: (temporada: string) => void;

}

const GlobalSettingsContext =
  createContext<GlobalSettingsContextType | undefined>(undefined);

export const useGlobalSettings = () => {
  const context = useContext(GlobalSettingsContext);
  if (!context) {
    throw new Error(
      'useGlobalSettings must be used within a GlobalSettingsProvider'
    );
  }
  return context;
};

interface GlobalSettingsProviderProps {
  children: ReactNode;
  user?: {
    planta?: string;     // 👈 viene desde la BD
    temporada?: string;  // opcional
  };
}

export const GlobalSettingsProvider: React.FC<GlobalSettingsProviderProps> = ({
  children,
  user
}) => {
  const [planta, setPlanta] = useState<string>(''); // Valor por defecto
  const [temporada, setTemporada] = useState<string>('24-25');

  // Convierte "san_felipe" -> "San Felipe", "teno" -> "Teno"
  const getFormattedPlanta = () => {
    if (!planta) return '';
    return planta
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // 🔥 CARGA AUTOMÁTICA DESDE USUARIO (BD)
  useEffect(() => {
    if (user?.planta) {
      setPlanta(user.planta);
    }
    if (user?.temporada) {
      setTemporada(user.temporada);
    }
  }, [user]);
    

  return (
    <GlobalSettingsContext.Provider value={{ planta, setPlanta, temporada, setTemporada, getFormattedPlanta }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
};
