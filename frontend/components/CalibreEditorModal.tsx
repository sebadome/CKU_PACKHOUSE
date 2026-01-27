import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import Input from './ui/Input';
import { CalibreEntry } from './CalibreManager';

interface CalibreEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (calibre: CalibreEntry) => void;
    calibre: CalibreEntry | null;
    isEditable?: boolean;
}

export const CalibreEditorModal: React.FC<CalibreEditorModalProps> = ({ isOpen, onClose, onSave, calibre, isEditable }) => {
    const [currentCalibre, setCurrentCalibre] = useState<CalibreEntry | null>(null);

    useEffect(() => {
        if (calibre) {
            // Deep copy to avoid mutating the original state directly
            setCurrentCalibre(JSON.parse(JSON.stringify(calibre)));
        }
    }, [calibre]);

    const handleSave = () => {
        if (currentCalibre) {
            onSave(currentCalibre);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentCalibre(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleFirmezaChange = (index: number, side: 'lado1_lb' | 'lado2_lb', value: string) => {
        setCurrentCalibre(prev => {
            if (!prev || !prev.firmeza) return prev;
            const newFirmeza = [...prev.firmeza];
            newFirmeza[index] = { ...newFirmeza[index], [side]: value === '' ? null : parseFloat(value) };
            return { ...prev, firmeza: newFirmeza };
        });
    };

    if (!isOpen || !currentCalibre) return null;
    
    const isNew = !calibre?.calibre; // Simple check if it's a new entry

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isNew ? 'Añadir Calibre' : (isEditable ? 'Editar Calibre' : 'Ver Calibre')}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Calibre" name="calibre" value={currentCalibre.calibre || ''} onChange={handleChange} disabled={!isEditable} />
                    <Input label="N° Frutos" name="n_frutos_calibre" type="number" value={currentCalibre.n_frutos_calibre || ''} onChange={handleChange} disabled={!isEditable} />
                    <Input label="°Brix" name="brix_calibre" type="number" step="0.1" value={currentCalibre.brix_calibre || ''} onChange={handleChange} disabled={!isEditable} />
                </div>

                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Registro de Firmezas (lb)</h4>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 p-2 border rounded-lg bg-gray-50">
                        <div className="font-medium text-sm">Fruto</div>
                        <div className="font-medium text-sm">Lado 1</div>
                        <div className="font-medium text-sm">Lado 2</div>
                        {(currentCalibre.firmeza || []).map((f, index) => (
                            <React.Fragment key={index}>
                                <div className="flex items-center font-medium text-sm pl-2">Fruto {index + 1}</div>
                                <div>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={f.lado1_lb ?? ''}
                                        onChange={(e) => handleFirmezaChange(index, 'lado1_lb', e.target.value)}
                                        disabled={!isEditable}
                                        className="text-sm p-1 h-8"
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={f.lado2_lb ?? ''}
                                        onChange={(e) => handleFirmezaChange(index, 'lado2_lb', e.target.value)}
                                        disabled={!isEditable}
                                        className="text-sm p-1 h-8"
                                    />
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-6">
                <Button variant="secondary" onClick={onClose}>Cerrar</Button>
                {isEditable && <Button onClick={handleSave}>Guardar Calibre</Button>}
            </div>
        </Modal>
    );
};
