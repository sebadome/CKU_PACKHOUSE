// components/FieldEditorDrawer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { FormField, FieldType, DynamicTableColumn } from '../types';
import { Modal } from './ui/Modal';
import Input from './ui/Input';
import Select from './ui/Select';
import { Button } from './ui/Button';
import { Trash2Icon, PlusCircleIcon } from './Icons';
import { v4 as uuidv4 } from 'uuid';

interface FieldEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: FormField) => void;
  field?: FormField;
  existingKeys: string[];
  slugifyFn: (text: string) => string;
}

const getNewField = (): Omit<FormField, 'id' | 'order'> => ({
  key: '',
  label: '',
  type: 'text',
  required: false,
  help: '',
  options: [],
  columns: [],
  initialRows: [],
  user_can_add_columns: true,
  user_can_add_rows: true,
  persist_schema_per_form: false,
  readOnly: false,
});

const fieldTypes: FieldType[] = [
  'text',
  'textarea',
  'integer',
  'decimal',
  'date',
  'time',
  'boolean',
  'select',
  'dynamic_table',
  'file',
];

const columnTypes: DynamicTableColumn['type'][] = [
  'text',
  'integer',
  'decimal',
  'select',
  'boolean',
];

export const FieldEditorDrawer: React.FC<FieldEditorDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  field,
  existingKeys,
  slugifyFn,
}) => {
  const [editedField, setEditedField] = useState<Omit<FormField, 'id' | 'order'>>(getNewField());
  const [keyError, setKeyError] = useState('');
  const [optionsText, setOptionsText] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const initial = field ? { ...getNewField(), ...field } : getNewField();

    // Hydrate initialRows with unique IDs
    if (initial.initialRows) {
      initial.initialRows = initial.initialRows.map((row: any) =>
        row._id ? row : { ...row, _id: uuidv4() }
      );
    }

    setEditedField(initial);
    setOptionsText((initial.options ?? []).join('\n'));
    setKeyError('');
  }, [isOpen, field]);

  const isEditing = !!field;

  const validateKey = (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) {
      setKeyError('La clave no puede estar vacía.');
      return;
    }
    const isOwnKey = field?.key === trimmed;
    if (!isOwnKey && existingKeys.includes(trimmed)) {
      setKeyError('Esta clave ya está en uso en la plantilla.');
      return;
    }
    setKeyError('');
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    if (!isEditing) {
      const newKey = slugifyFn(newLabel);
      setEditedField((p) => ({ ...p, label: newLabel, key: newKey }));
      validateKey(newKey);
    } else {
      setEditedField((p) => ({ ...p, label: newLabel }));
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = slugifyFn(e.target.value);
    setEditedField((p) => ({ ...p, key: newKey }));
    validateKey(newKey);
  };

  const onFieldTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as FieldType;
    setEditedField((p) => {
      const next = { ...p, type: newType };
      if (newType !== 'select') {
        next.options = [];
      }
      if (newType !== 'dynamic_table') {
        next.columns = [];
        next.user_can_add_columns = false;
        next.user_can_add_rows = true;
        next.persist_schema_per_form = false;
      }
      return next;
    });
  };

  const canSave = useMemo(() => {
    if (!editedField.label.trim()) return false;
    if (!editedField.key.trim() || !!keyError) return false;
    if (editedField.type === 'select') {
      const opts = optionsText.split('\n').map((s) => s.trim()).filter(Boolean);
      return opts.length > 0;
    }
    if (editedField.type === 'dynamic_table') {
      return (editedField.columns ?? []).length > 0;
    }
    return true;
  }, [editedField, keyError, optionsText]);

  const handleSave = () => {
    if (!canSave) return;
    const finalField: FormField = { ...(editedField as FormField) };

    if (finalField.type === 'select') {
      finalField.options = optionsText.split('\n').map((s) => s.trim()).filter(Boolean);
    }

    if (finalField.type === 'dynamic_table' && finalField.columns) {
      const seen = new Set<string>();
      finalField.columns = finalField.columns
        .map((c) => ({
          ...c,
          key: slugifyFn(c.key || c.label || ''),
          label: (c.label || '').trim() || c.key,
        }))
        .filter((c) => {
          if (!c.key) return false;
          if (seen.has(c.key)) return false;
          seen.add(c.key);
          return true;
        });
    }

    const payload = isEditing ? { ...finalField, id: field!.id, order: field!.order } : finalField;
    onSave(payload);
  };

  const handleColumnChange = (index: number, prop: keyof DynamicTableColumn, value: any) => {
    setEditedField((p) => {
      const cols = [...(p.columns || [])];
      cols[index] = { ...cols[index], [prop]: value };
      if (prop === 'type') {
        const t = value as DynamicTableColumn['type'];
        if (t === 'integer' || t === 'decimal' || t === 'boolean') {
          delete cols[index].options;
        }
      }
      return { ...p, columns: cols };
    });
  };

  const addColumn = () => {
    const newCol: DynamicTableColumn = {
      key: `col_${Date.now()}`,
      label: 'Nuevo Campo',
      type: 'text',
      validations: {},
      required: false,
      readOnly: false,
    };
    setEditedField((p) => ({ ...p, columns: [...(p.columns || []), newCol] }));
  };

  const removeColumn = (index: number) => {
    setEditedField((p) => ({
      ...p,
      columns: (p.columns || []).filter((_, i) => i !== index),
    }));
  };
  
  const updateColValidation = (idx: number, vkey: 'min' | 'max' | 'decimals', raw: string) => {
    setEditedField(p => {
        const columns = p.columns ? [...p.columns] : [];
        if (!columns[idx]) return p;

        const newColumn = { ...columns[idx] };
        const newValidations = { ...(newColumn.validations || {}) };
        
        const numericValue = parseFloat(raw);
        if (raw.trim() === '' || isNaN(numericValue)) {
            delete newValidations[vkey];
        } else {
            newValidations[vkey] = numericValue;
        }
        
        newColumn.validations = newValidations;
        columns[idx] = newColumn;
        
        return { ...p, columns };
    });
  };
  
  const handleInitialRowChange = (rowId: string, colKey: string, value: any) => {
    setEditedField(p => {
        if (!p.initialRows) return p;
        const newRows = p.initialRows.map((row: any) => {
            if (row._id === rowId) {
                return { ...row, [colKey]: value };
            }
            return row;
        });
        return { ...p, initialRows: newRows };
    });
  };

  const addInitialRow = () => {
    setEditedField(p => {
        const newRow = (p.columns || []).reduce(
            (acc, col) => ({ ...acc, [col.key]: col.type === 'boolean' ? false : '' }),
            { _id: uuidv4() } as Record<string, any>
        );
        return { ...p, initialRows: [...(p.initialRows || []), newRow] };
    });
  };

  const removeInitialRow = (rowId: string) => {
    setEditedField(p => ({
        ...p,
        initialRows: (p.initialRows || []).filter((row: any) => row._id !== rowId),
    }));
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Campo' : 'Añadir Nuevo Campo'}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
        <Input label="Etiqueta (Label)" value={editedField.label} onChange={handleLabelChange} required />
        <Input label="Clave (Key)" value={editedField.key} onChange={handleKeyChange} required error={keyError} />
        <Select label="Tipo de Campo" value={editedField.type} onChange={onFieldTypeChange}>
          {fieldTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="required" checked={!!editedField.required} onChange={(e) => setEditedField((p) => ({ ...p, required: e.target.checked })) } className="h-4 w-4 rounded border-gray-300 text-cku-blue focus:ring-cku-blue"/>
            <label htmlFor="required" className="text-sm font-medium text-gray-700">Requerido</label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="readonly" checked={!!editedField.readOnly} onChange={(e) => setEditedField((p) => ({ ...p, readOnly: e.target.checked })) } className="h-4 w-4 rounded border-gray-300 text-cku-blue focus:ring-cku-blue"/>
            <label htmlFor="readonly" className="text-sm font-medium text-gray-700">Solo lectura</label>
          </div>
        </div>
        <Input label="Ayuda (opcional)" value={editedField.help || ''} onChange={(e) => setEditedField((p) => ({ ...p, help: e.target.value })) }/>

        {editedField.type === 'select' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opciones (una por línea)</label>
            <textarea rows={4} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-cku-blue focus:border-cku-blue sm:text-sm" value={optionsText} onChange={(e) => setOptionsText(e.target.value)} placeholder={'Ej:\nOpción 1\nOpción 2\nOpción 3'} />
          </div>
        )}

        {editedField.type === 'dynamic_table' && (
          <div className="space-y-4">
            <div className="space-y-3 p-2 border rounded-lg">
                <h4 className="font-semibold">Configurar Columnas</h4>
                {(editedField.columns || []).map((col, idx) => {
                    return (
                        <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start border-b pb-3">
                           <div className="lg:col-span-3"><Input label="Header" value={col.label} onChange={(e) => handleColumnChange(idx, 'label', e.target.value)} /></div>
                           <div className="lg:col-span-3"><Input label="Key" value={col.key} onChange={(e) => handleColumnChange(idx, 'key', slugifyFn(e.target.value))} /></div>
                           <div className="lg:col-span-3"><Select label="Tipo" value={col.type} onChange={(e) => handleColumnChange(idx, 'type', e.target.value as DynamicTableColumn['type'])}>{columnTypes.map((t) => (<option key={t} value={t}>{t}</option>))}</Select></div>
                           <div className="lg:col-span-3 flex items-end justify-end"><Button variant="destructive" size="sm" onClick={() => removeColumn(idx)} aria-label="Eliminar columna" title="Eliminar columna"><Trash2Icon className="w-4 h-4" /></Button></div>
                           {col.type === 'select' && (<div className="lg:col-span-12"><label className="block text-sm font-medium text-gray-700 mb-1">Opciones (una por línea)</label><textarea rows={3} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-cku-blue focus:border-cku-blue sm:text-sm" value={(col.options || []).join('\n')} onChange={(e) => handleColumnChange(idx, 'options', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} placeholder={'Ej:\nBueno\nRegular\nMalo'}/></div>)}
                        </div>
                    )
                })}
                <Button variant="secondary" size="sm" onClick={addColumn}><PlusCircleIcon className="w-4 h-4 mr-1" />Añadir Columna</Button>
            </div>
            
            <div className="space-y-3 p-2 border rounded-lg">
                <h4 className="font-semibold">Filas Iniciales (Pre-definidas)</h4>
                 {(editedField.columns && editedField.columns.length > 0) ? (
                    <>
                        <div className="space-y-3">
                            {(editedField.initialRows || []).map((row: any) => (
                                <div key={row._id} className="p-3 border rounded-md bg-gray-50 relative">
                                    <div className="flex items-start gap-x-4">
                                        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                            {(editedField.columns || []).map(col => {
                                                const value = row[col.key];
                                                const cellKey = `${row._id}-${col.key}`;

                                                const commonProps = {
                                                    value: value ?? '',
                                                    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                                                        const newValue = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
                                                        handleInitialRowChange(row._id, col.key, newValue);
                                                    }
                                                };
                                                
                                                let cellInput;
                                                switch (col.type) {
                                                    case 'select':
                                                        cellInput = (
                                                            <Select key={cellKey} {...commonProps} className="text-xs p-1 h-8">
                                                                <option value="">--</option>
                                                                {(col.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                            </Select>
                                                        );
                                                        break;
                                                    case 'boolean':
                                                        cellInput = (
                                                            <div className="flex items-center h-full pt-1">
                                                              <input type="checkbox" key={cellKey} checked={!!value} {...commonProps} className="h-4 w-4 rounded border-gray-300 text-cku-blue focus:ring-cku-blue"/>
                                                            </div>
                                                        );
                                                        break;
                                                    case 'integer':
                                                    case 'decimal':
                                                        cellInput = <Input key={cellKey} type="number" {...commonProps} className="text-xs p-1 h-8" />;
                                                        break;
                                                    default:
                                                        cellInput = <Input key={cellKey} type="text" {...commonProps} className="text-xs p-1 h-8" />;
                                                }

                                                return (
                                                    <div key={col.key}>
                                                        <label className="block text-xs font-medium text-gray-600 mb-0.5">{col.label}</label>
                                                        {cellInput}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            onClick={() => removeInitialRow(row._id)} 
                                            aria-label="Eliminar Fila Inicial"
                                            className="mt-5"
                                        >
                                            <Trash2Icon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="secondary" size="sm" onClick={addInitialRow} className="mt-3">
                            <PlusCircleIcon className="w-4 h-4 mr-1" />Añadir Fila Inicial
                        </Button>
                    </>
                ) : (
                    <p className="text-xs text-gray-500">Defina al menos una columna para añadir filas iniciales.</p>
                )}
            </div>
            
            <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-2"><input type="checkbox" id="can_add_rows" checked={!!editedField.user_can_add_rows} onChange={(e) => setEditedField((p) => ({ ...p, user_can_add_rows: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-cku-blue focus:ring-cku-blue" /><label htmlFor="can_add_rows" className="text-sm font-medium text-gray-700">Usuario puede añadir filas</label></div>
                <div className="flex items-center space-x-2"><input type="checkbox" id="can_add_cols" checked={!!editedField.user_can_add_columns} onChange={(e) => setEditedField((p) => ({ ...p, user_can_add_columns: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-cku-blue focus:ring-cku-blue" /><label htmlFor="can_add_cols" className="text-sm font-medium text-gray-700">Usuario puede añadir columnas</label></div>
                <div className="flex items-center space-x-2"><input type="checkbox" id="persist_schema" checked={!!editedField.persist_schema_per_form} onChange={(e) => setEditedField((p) => ({ ...p, persist_schema_per_form: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-cku-blue focus:ring-cku-blue" /><label htmlFor="persist_schema" className="text-sm font-medium text-gray-700">Guardar cambios de columnas por formulario</label></div>
            </div>

          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!canSave}>Guardar Campo</Button>
        </div>
      </div>
    </Modal>
  );
};