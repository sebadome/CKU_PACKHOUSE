const API_BASE_URL = 'http://localhost:3001/api';

interface DynamicOptionsCache {
  [key: string]: {
    data: string[];
    timestamp: number;
  };
}

const cache: DynamicOptionsCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const getDynamicOptions = async (optionType: string): Promise<string[]> => {
  // Verificar cache
  const cached = cache[optionType];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${optionType}`);
    const result = await response.json();

    if (result.success) {
      const options = result.data.map((item: any) => {
        
        if (optionType === 'variedades') {
          return item.variedades ?? item.variedad ?? Object.values(item)[0];
        }
        return item;
      }).filter(Boolean);

      // Guardar en cache
      cache[optionType] = {
        data: options,
        timestamp: Date.now(),
      };

      return options;
    } else {
      console.error(`Error al cargar ${optionType}:`, result.error);
      return [];
    }
  } catch (error) {
    console.error(`Error al obtener opciones dinámicas para ${optionType}:`, error);
    return [];
  }
};

// Función para pre-cargar opciones comunes
export const preloadCommonOptions = async () => {
  await getDynamicOptions('variedades');
  // Agregar otros endpoints comunes aquí
};