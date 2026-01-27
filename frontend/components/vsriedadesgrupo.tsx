import { useEffect, useState } from 'react';

export interface VariedadOption {
  variedad: string;
  grupo: string;
}

interface Props {
  value: string;
  onChange: (variedad: string, grupo: string) => void;
  disabled?: boolean;
}

export const VariedadSelect: React.FC<Props> = ({
  value,
  onChange,
  disabled
}) => {
  const [variedades, setVariedades] = useState<VariedadOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/variedades');
        const json = await res.json();
        if (json.success) {
          setVariedades(json.data);
        }
      } catch (err) {
        console.error('Error cargando variedades', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const variedad = e.target.value;
    const grupo = variedades.find(v => v.variedad === variedad)?.grupo ?? '';
    onChange(variedad, grupo);
  };

  return (
    <select
      value={value ?? ''}
      onChange={handleChange}
      disabled={disabled || loading}
      className="w-full rounded border px-2 py-1 text-sm"
    >
      <option value="">-- Seleccionar --</option>

      {variedades.map(v => (
        <option key={v.variedad} value={v.variedad}>
          {v.variedad}
        </option>
      ))}
    </select>
  );
};
export default VariedadSelect;