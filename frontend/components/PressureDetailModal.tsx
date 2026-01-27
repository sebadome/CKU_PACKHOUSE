import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import Input from './ui/Input';
import { PressureEntry } from './PressureMatrixManager';

interface PressureDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: PressureEntry) => void;
    entry: PressureEntry | null;
    isEditable?: boolean;
    isWeightMode?: boolean; // NEW: Indica si se opera en modo pesos
}

export const PressureDetailModal: React.FC<PressureDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    entry, 
    isEditable,
    isWeightMode 
}) => {
    const [currentEntry, setCurrentEntry] = useState<PressureEntry | null>(null);

    useEffect(() => {
        if (entry) {
            // Copia profunda para no mutar el estado original directamente
            setCurrentEntry(JSON.parse(JSON.stringify(entry)));
        }
    }, [entry]);

    const handleSave = () => {
        if (currentEntry) {
            // Guardamos el detalle sin alterar el n_frutos, 
            // ya que este viene definido por la tabla principal.
            onSave(currentEntry);
        }
    };

    const handlePressureChange = (index: number, pType: 'p1' | 'p2', value: string) => {
        setCurrentEntry(prev => {
            if (!prev || !prev.detalles) return prev;
            const newDetalles = [...prev.detalles];
            newDetalles[index] = { ...newDetalles[index], [pType]: value === '' ? null : parseFloat(value) };
            return { ...prev, detalles: newDetalles };
        });
    };

    if (!isOpen || !currentEntry) return null;

    const modalTitlePrefix = isWeightMode ? 'Detalle de Pesos' : 'Detalle de Presiones';
    const inputHeader1 = isWeightMode ? 'Peso' : 'Presión 1';
    const inputHeader2 = 'Presión 2';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditable ? `${modalTitlePrefix} - Calibre: ${currentEntry.calibre || 'S/E'}` : `Ver ${modalTitlePrefix}`}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">N° Fruto</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{inputHeader1}</th>
                                {!isWeightMode && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{inputHeader2}</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {(currentEntry.detalles || []).map((det, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700 bg-gray-50">
                                        Fruto {index + 1}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={det.p1 ?? ''}
                                            onChange={(e) => handlePressureChange(index, 'p1', e.target.value)}
                                            disabled={!isEditable}
                                            className="text-sm p-1 h-10"
                                            placeholder="--"
                                        />
                                    </td>
                                    {!isWeightMode && (
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={det.p2 ?? ''}
                                                onChange={(e) => handlePressureChange(index, 'p2', e.target.value)}
                                                disabled={!isEditable}
                                                className="text-sm p-1 h-10"
                                                placeholder="--"
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                { (currentEntry.detalles || []).length === 0 && (
                    <p className="text-center py-4 text-gray-500 italic">No se han definido frutos en la tabla principal.</p>
                )}
                <p className="text-xs text-gray-500 italic">
                    * El número de filas mostradas depende del valor '# Frutos' ingresado en la tabla principal.
                </p>
            </div>

            <div className="flex justify-end gap-2 pt-6">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                {isEditable && <Button onClick={handleSave}>Guardar Detalle</Button>}
            </div>
        </Modal>
    );
};