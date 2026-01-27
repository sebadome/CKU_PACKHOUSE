import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import Input from './ui/Input';

interface FindingsDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (row: any) => void;
    row: any;
    isEditable?: boolean;
}

const DEFECTS = [
    { key: 'bp_ext_l', label: 'BITTER PIT EXTERNO L' },
    { key: 'bp_ext_g', label: 'BITTER PIT EXTERNO G' },
    { key: 'lent_l', label: 'LENTICELOSIS L' },
    { key: 'lent_g', label: 'LENTICELOSIS G' },
    { key: 'sun_l', label: 'SUNSCALD L' },
    { key: 'sun_g', label: 'SUNSCALD G' },
    { key: 'machucon', label: 'MACHUCÓN' },
    { key: 'herida_abierta', label: 'HERIDA ABIERTA' },
    { key: 'russet', label: 'RUSSET' },
    { key: 'roce', label: 'ROCE' },
    { key: 'cracking', label: 'CRACKING' },
    { key: 'golpe_sol', label: 'GOLPE DE SOL' },
    { key: 'pudricion', label: 'PUDRICIÓN' },
    { key: 'otros', label: 'OTROS' },
];

export const FindingsDetailModal: React.FC<FindingsDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    row, 
    isEditable 
}) => {
    const [currentRow, setCurrentRow] = useState<any>(null);

    useEffect(() => {
        if (row) {
            setCurrentRow({ ...row });
        }
    }, [row]);

    const handleSave = () => {
        if (currentRow) {
            onSave(currentRow);
        }
    };

    const handleValueChange = (key: string, value: string) => {
        setCurrentRow((prev: any) => ({
            ...prev,
            [key]: value === '' ? '' : value
        }));
    };

    const handleBlur = (key: string, value: string) => {
        if (!currentRow || !isEditable) return;

        const calibre = parseFloat(currentRow.calibre);
        
        // Reglas de conversión:
        // 1. No debe ser vacío.
        // 2. Debe ser un número entero (no contiene punto).
        // 3. El calibre de la fila debe ser mayor a 0.
        if (value !== '' && !value.includes('.') && !isNaN(calibre) && calibre > 0) {
            const units = parseInt(value);
            if (!isNaN(units)) {
                const percentage = (units / calibre) * 100;
                const formattedValue = parseFloat(percentage.toFixed(2));
                
                setCurrentRow((prev: any) => ({
                    ...prev,
                    [key]: formattedValue
                }));
            }
        } else if (value !== '') {
            // Si ya tiene decimales o no hay calibre, solo nos aseguramos de guardar como número
            setCurrentRow((prev: any) => ({
                ...prev,
                [key]: parseFloat(value)
            }));
        }
    };

    if (!isOpen || !currentRow) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditable ? "Detalle de Hallazgos (Defectos)" : "Ver Detalle de Hallazgos"}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3">
                <div className="bg-gray-100/50 p-4 rounded-xl border border-gray-200 mb-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase">Base de cálculo (Calibre):</span>
                        <span className="text-sm font-bold text-cku-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {currentRow.calibre || 'No definido'}
                        </span>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Registro de hallazgos</p>
                    <div className="space-y-3">
                        {DEFECTS.map((defect) => (
                            <div key={defect.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                <label htmlFor={`defect-${defect.key}`} className="text-sm font-medium text-gray-700">
                                    {defect.label}
                                </label>
                                <div className="w-full sm:w-32">
                                    <Input
                                        id={`defect-${defect.key}`}
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={currentRow[defect.key] ?? ''}
                                        onChange={(e) => handleValueChange(defect.key, e.target.value)}
                                        onBlur={(e) => handleBlur(defect.key, e.target.value)}
                                        disabled={!isEditable}
                                        className="text-center font-semibold"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-2 px-1">
                    <p className="text-[11px] text-gray-500 italic">
                        * Ingrese la cantidad de frutos (unidades). El sistema convertirá automáticamente a porcentaje basado en el calibre.
                    </p>
                    <p className="text-[11px] text-gray-500 italic">
                        * Si desea ingresar un porcentaje manualmente, use decimales (ej: 2.0).
                    </p>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-6 border-t mt-4">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                {isEditable && <Button onClick={handleSave}>Guardar Hallazgos</Button>}
            </div>
        </Modal>
    );
};