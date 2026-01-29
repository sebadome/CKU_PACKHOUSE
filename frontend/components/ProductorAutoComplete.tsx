// ProductorAutocomplete.tsx
import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField } from '@mui/material';

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

const ProductorAutocomplete: React.FC<Props> = ({ value, onChange, disabled }) => {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductores = async () => {
      try {
        const res = await fetch('/api/productores'); // tu endpoint para productores
        const json = await res.json();
        if (json.success) {
          const cleanOptions = json.data.map((p: string) => p.trim()); // eliminamos espacios
          setOptions(cleanOptions);
        }
      } catch (err) {
        console.error('Error cargando productores', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductores();
  }, []);

  return (
    <Autocomplete
      options={options}
      value={value || ''}
      onChange={(_, newValue) => onChange(newValue ?? '')}
      disabled={disabled || loading}
      renderInput={(params) => <TextField {...params} label="Productor" size="small" />}
      freeSolo
    />
  );
};

export default ProductorAutocomplete;
