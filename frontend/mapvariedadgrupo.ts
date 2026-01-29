import { VariedadOption } from './types';

export const getVariedades = async (): Promise<VariedadOption[]> => {
  const res = await fetch('http://localhost:3001/api/variedades');

  if (!res.ok) return [];

  const json = await res.json();
  return json.data;
};


