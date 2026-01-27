
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { PlusCircleIcon, EditIcon, Trash2Icon } from './Icons';
import { PressureDetailModal } from './PressureDetailModal';
import { v4 as uuidv4 } from 'uuid';

export type PressureEntry = {
    _id: string;
    calibre?: string;
    n_frutos?: number;
    brix?: number;
    detalles?: { p1?: number | null; p2?: number | null }[];
    // Campos para resumen por fila
    max?: number | string;
    min?: number | string;
    x?: number | string;
};

interface PressureMatrixManagerProps {
    value: PressureEntry[];
    onChange: (newValue: PressureEntry[]) => void;
    isEditable?: boolean;
    hideBrix?: boolean;
    hideCalibre?: boolean; // NEW
    showSummaryColumns?: boolean; 
    showOnlyAverage?: boolean; // NEW
    isWeightMode?: boolean; 
}

export const PressureMatrixManager: React.FC<PressureMatrixManagerProps> = ({ 
    value, 
    onChange, 
    isEditable, 
    hideBrix, 
    hideCalibre,
    showSummaryColumns,
    showOnlyAverage,
    isWeightMode
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<PressureEntry | null>(null);

    const handleAdd = () => {
        const newEntry: PressureEntry = {
            _id: uuidv4(),
            calibre: '',
            n_frutos: 0,
            brix: 0,
            detalles: [],
        };
        onChange([...(value || []), newEntry]);
    };

    const handleEdit = (entry: PressureEntry) => {
        const n = Math.max(0, entry.n_frutos || 0);
        let detallesData = [...(entry.detalles || [])];
        
        if (detallesData.length > n) {
            detallesData = detallesData.slice(0, n);
        } else {
            while (detallesData.length < n) {
                detallesData.push({ p1: null, p2: null });
            }
        }
        
        setEditingEntry({ ...entry, n_frutos: n, detalles: detallesData });
        setIsModalOpen(true);
    };

    const handleSave = (savedEntry: PressureEntry) => {
        const exists = value.some(c => c._id === savedEntry._id);
        const newValue = exists
            ? value.map(c => c._id === savedEntry._id ? savedEntry : c)
            : [...value, savedEntry];
        onChange(newValue);
        setIsModalOpen(false);
        setEditingEntry(null);
    };

    const handleDelete = (id: string) => {
        onChange(value.filter(c => c._id !== id));
    };

    const inputClasses = "block w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-cku-blue focus:border-cku-blue text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-all";
    const readOnlyClasses = "block w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg shadow-sm text-sm text-gray-500 cursor-not-allowed text-center";

    const detailColumnLabel = isWeightMode ? "Detalle de pesos" : "Detalle de presiones";
    const detailButtonLabel = isWeightMode ? (isEditable ? 'Registrar / Ver pesos' : 'Ver pesos') : (isEditable ? 'Registrar / Ver presiones' : 'Ver presiones');

    return (
        <div className="w-full relative group">
            <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
                <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            {!hideCalibre && <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[140px]">Calibre</th>}
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]"># Frutos</th>
                            <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[200px]">{detailColumnLabel}</th>
                            {!hideBrix && <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[140px]">Sólidos solubles (°Brix)</th>}
                            {showSummaryColumns && !showOnlyAverage && (
                                <>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[80px]">MAX</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[80px]">MIN</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">X (Promedio)</th>
                                </>
                            )}
                            {showOnlyAverage && (
                                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[150px]">Promedio presiones</th>
                            )}
                            {isEditable && <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-14" />}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {value && value.map((entry) => (
                            <tr key={entry._id} className="hover:bg-gray-50/50 transition-colors">
                                {!hideCalibre && (
                                    <td className="py-3 px-4 whitespace-nowrap align-middle">
                                        <input 
                                            type="text" 
                                            className={inputClasses}
                                            value={entry.calibre || ''}
                                            onChange={(e) => {
                                                const newVal = value.map(item => item._id === entry._id ? { ...item, calibre: e.target.value } : item);
                                                onChange(newVal);
                                            }}
                                            placeholder="Ingrese calibre"
                                            disabled={!isEditable}
                                        />
                                    </td>
                                )}
                                <td className="py-3 px-4 whitespace-nowrap align-middle">
                                    <input 
                                        type="number" 
                                        step="1"
                                        min="0"
                                        className={inputClasses}
                                        value={entry.n_frutos ?? ''}
                                        onChange={(e) => {
                                            let n = e.target.value === '' ? 0 : parseInt(e.target.value);
                                            if (n < 0) n = 0;
                                            if (!isWeightMode && n > 10) n = 10;
                                            
                                            const newVal = value.map(item => {
                                                if (item._id === entry._id) {
                                                    let currentDetalles = [...(item.detalles || [])];
                                                    if (currentDetalles.length > n) {
                                                        currentDetalles = currentDetalles.slice(0, n);
                                                    } else {
                                                        while (currentDetalles.length < n) {
                                                            currentDetalles.push({ p1: null, p2: null });
                                                        }
                                                    }
                                                    return { ...item, n_frutos: n, detalles: currentDetalles };
                                                }
                                                return item;
                                            });
                                            onChange(newVal);
                                        }}
                                        placeholder="0"
                                        disabled={!isEditable}
                                    />
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap align-middle text-center">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)} className="text-cku-blue hover:bg-blue-50 border border-transparent hover:border-blue-100">
                                        <EditIcon className="w-4 h-4 mr-2"/> {detailButtonLabel}
                                    </Button>
                                </td>
                                {!hideBrix && (
                                    <td className="py-3 px-4 whitespace-nowrap align-middle">
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            className={inputClasses}
                                            value={entry.brix ?? ''}
                                            onChange={(e) => {
                                                const newVal = value.map(item => item._id === entry._id ? { ...item, brix: e.target.value === '' ? undefined : parseFloat(e.target.value) } : item);
                                                onChange(newVal);
                                            }}
                                            placeholder="0.0"
                                            disabled={!isEditable}
                                        />
                                    </td>
                                )}
                                {showSummaryColumns && !showOnlyAverage && (
                                    <>
                                        <td className="py-3 px-4 whitespace-nowrap align-middle">
                                            <div className={readOnlyClasses}>{entry.max ?? '--'}</div>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap align-middle">
                                            <div className={readOnlyClasses}>{entry.min ?? '--'}</div>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap align-middle">
                                            <div className={readOnlyClasses}>{entry.x ?? '--'}</div>
                                        </td>
                                    </>
                                )}
                                {showOnlyAverage && (
                                    <td className="py-3 px-4 whitespace-nowrap align-middle">
                                        <div className={readOnlyClasses}>{entry.x ?? '--'}</div>
                                    </td>
                                )}
                                {isEditable && (
                                    <td className="py-3 px-4 text-right align-middle">
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(entry._id)}
                                            className="text-gray-400 hover:text-cku-red transition-colors p-2 rounded-md hover:bg-red-50"
                                            title="Eliminar fila"
                                        >
                                            <Trash2Icon className="w-5 h-5" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isEditable && (
                <div className="mt-4">
                    <Button variant="secondary" onClick={handleAdd}>
                        <PlusCircleIcon className="w-5 h-5 mr-2" />
                        Añadir Fila
                    </Button>
                </div>
            )}

            <PressureDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                entry={editingEntry}
                isEditable={isEditable}
                isWeightMode={isWeightMode}
            />
        </div>
    );
};
