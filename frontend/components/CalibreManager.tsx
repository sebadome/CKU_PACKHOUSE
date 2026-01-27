import React, { useState } from 'react';
import { Button } from './ui/Button';
import { PlusCircleIcon, EditIcon, Trash2Icon } from './Icons';
import { CalibreEditorModal } from './CalibreEditorModal';
import { v4 as uuidv4 } from 'uuid';

export type CalibreEntry = {
    _id: string;
    calibre?: string;
    n_frutos_calibre?: number;
    brix_calibre?: number;
    firmeza?: { lado1_lb?: number | null; lado2_lb?: number | null }[];
};

interface CalibreManagerProps {
    value: CalibreEntry[];
    onChange: (newValue: CalibreEntry[]) => void;
    isEditable?: boolean;
}

export const CalibreManager: React.FC<CalibreManagerProps> = ({ value, onChange, isEditable }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCalibre, setEditingCalibre] = useState<CalibreEntry | null>(null);

    const handleAdd = () => {
        const newEntry: CalibreEntry = {
            _id: uuidv4(),
            firmeza: Array(10).fill({ lado1_lb: null, lado2_lb: null }),
        };
        setEditingCalibre(newEntry);
        setIsModalOpen(true);
    };

    const handleEdit = (calibre: CalibreEntry) => {
        // Ensure firmeza array has 10 items for the modal
        const firmezaData = [...(calibre.firmeza || [])];
        while (firmezaData.length < 10) {
            firmezaData.push({ lado1_lb: null, lado2_lb: null });
        }
        setEditingCalibre({ ...calibre, firmeza: firmezaData.slice(0, 10) });
        setIsModalOpen(true);
    };

    const handleSave = (savedCalibre: CalibreEntry) => {
        const exists = value.some(c => c._id === savedCalibre._id);
        const newValue = exists
            ? value.map(c => c._id === savedCalibre._id ? savedCalibre : c)
            : [...value, savedCalibre];
        onChange(newValue);
        setIsModalOpen(false);
        setEditingCalibre(null);
    };

    const handleDelete = (id: string) => {
        onChange(value.filter(c => c._id !== id));
    };

    return (
        <div>
            <div className="space-y-3">
                {value && value.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 font-semibold text-sm text-gray-600 px-4 py-2 bg-gray-50 rounded-t-lg border-x border-t">
                        <span>Calibre</span>
                        <span>N° Frutos</span>
                        <span>°Brix</span>
                        <span className="text-right">Acciones</span>
                    </div>
                )}
                {value && value.map(calibre => (
                    <div key={calibre._id} className="grid grid-cols-4 gap-4 items-center px-4 py-3 rounded-lg bg-white border">
                        <span className="font-medium">{calibre.calibre || '-'}</span>
                        <span>{calibre.n_frutos_calibre || '-'}</span>
                        <span>{calibre.brix_calibre || '-'}</span>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(calibre)}>
                                <EditIcon className="w-4 h-4 mr-1"/> {isEditable ? 'Editar' : 'Ver'}
                            </Button>
                             {isEditable && (
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(calibre._id)}>
                                    <Trash2Icon className="w-4 h-4"/>
                                </Button>
                             )}
                        </div>
                    </div>
                ))}
            </div>

            {isEditable && (
                <Button variant="secondary" onClick={handleAdd} className="mt-4">
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    Añadir Fila
                </Button>
            )}

            <CalibreEditorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                calibre={editingCalibre}
                isEditable={isEditable}
            />
        </div>
    );
};