import React, { useState, useEffect } from 'react';
import { FormField, FieldType, FieldValidation } from '../types';
import { Modal } from './ui/Modal';
import Input from './ui/Input';
import Select from './ui/Select';
import { Button } from './ui/Button';

interface FieldEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: FormField) => void;
  field: FormField | null;
  isKeyEditable?: boolean;
}

const fieldTypes: FieldType[] = [
  'text', 'textarea', 'integer', 'decimal', 'date', 'time', 'boolean', 
  'select', 'multiselect', 'measure_series', 'file', 'dynamic_table'
];

export const FieldEditModal: React.FC<FieldEditModalProps> = ({ isOpen, onClose, onSave, field, isKeyEditable = false }) => {
  const [editedField, setEditedField] = useState<FormField | null>(field);

  useEffect(() => {
    setEditedField(field ? { ...field } : null);
  }, [field]);

  if (!isOpen || !editedField) return null;

  const handleSave = () => {
    onSave(editedField);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const finalValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    setEditedField({ ...editedField, [name]: finalValue });
  };
  
  const handleValidationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const validations: FieldValidation = { ...editedField.validations, [name]: value ? Number(value) : undefined };
      setEditedField({ ...editedField, validations });
  }

  const hasOptions = editedField.type === 'select' || editedField.type === 'multiselect';
  const hasNumericValidations = editedField.type === 'integer' || editedField.type === 'decimal';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Campo">
      <div className="space-y-4">
        <Input label="Etiqueta (Label)" name="label" value={editedField.label} onChange={handleInputChange} />
        <Input label="Clave (Key)" name="key" value={editedField.key} disabled={!isKeyEditable} onChange={handleInputChange} />
        <Select label="Tipo de Campo" name="type" value={editedField.type} onChange={(e) => setEditedField({...editedField, type: e.target.value as FieldType})}>
          {fieldTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </Select>
        <div className="flex items-center space-x-2">
            <input type="checkbox" id="required" name="required" checked={!!editedField.required} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-cku-blue focus:ring-cku-blue"/>
            <label htmlFor="required" className="text-sm font-medium text-gray-700">Requerido</label>
        </div>
        
        {hasOptions && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opciones (una por línea)</label>
                <textarea
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={editedField.options?.join('\n') || ''}
                    onChange={(e) => setEditedField({ ...editedField, options: e.target.value.split('\n') })}
                />
            </div>
        )}

        {hasNumericValidations && (
            <div className="grid grid-cols-2 gap-4">
                <Input label="Valor Mínimo" type="number" name="min" value={editedField.validations?.min || ''} onChange={handleValidationChange} />
                <Input label="Valor Máximo" type="number" name="max" value={editedField.validations?.max || ''} onChange={handleValidationChange} />
            </div>
        )}
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar Campo</Button>
        </div>
      </div>
    </Modal>
  );
};
