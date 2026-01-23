import React, { useState, useEffect, useRef } from 'react';
import { DynamicTableColumn } from '../types';
import { Trash2Icon, PlusCircleIcon, ChevronDownIcon, MaximizeIcon, MinimizeIcon, CalendarIcon, EditIcon } from './Icons';
import { Button } from './ui/Button';
import { v4 as uuidv4 } from 'uuid';
import { PressureDetailModal } from './PressureDetailModal';
import { FindingsDetailModal } from './FindingsDetailModal';

interface DynamicTableProps {
  columns: DynamicTableColumn[];
  data: Record<string, any>[];
  onChange: (data: Record<string, any>[], newColumns: DynamicTableColumn[]) => void;
  canAddRows?: boolean;
  canAddCols?: boolean;
  isReviewMode?: boolean;
  label?: string;
  activeColumnKey?: string; 
  onActiveColumnChange?: (key: string) => void; 
  highlightThreshold?: number;
}

const getStepFromValidations = (col: DynamicTableColumn) => {
  if (col.type === 'integer') return 1;
  if (col.type === 'decimal') {
    const d = col.validations?.decimals ?? 1;
    return Number((1 / Math.pow(10, d)).toFixed(d));
  }
  return undefined;
};

const getCellWidthClass = (type: string) => {
  switch (type) {
    case 'boolean':
      return 'min-w-[70px] text-center'; 
    case 'integer':
    case 'decimal':
      return 'min-w-[110px]'; 
    case 'date':
      return 'min-w-[170px]';
    case 'time':
      return 'min-w-[130px]';
    case 'select':
      return 'min-w-[160px]'; 
    case 'pressure_button':
      return 'min-w-[200px]';
    case 'findings_button':
      return 'min-w-[220px]';
    case 'text':
    default:
      return 'min-w-[180px]'; 
  }
};

export const DynamicTable: React.FC<DynamicTableProps> = ({
  columns,
  data,
  onChange,
  canAddRows,
  canAddCols,
  isReviewMode,
  label,
  activeColumnKey,
  onActiveColumnChange,
  highlightThreshold
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [pressureModalState, setPressureModalState] = useState<{ isOpen: boolean, rowId?: string, rowData?: any } | null>(null);
  const [findingsModalState, setFindingsModalState] = useState<{ isOpen: boolean, rowId?: string, rowData?: any } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Efecto para centrar la columna activa mediante scroll horizontal
  useEffect(() => {
    if (activeColumnKey && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeHeader = container.querySelector(`th[data-colkey="${activeColumnKey}"]`) as HTMLElement;
      
      if (activeHeader) {
        const containerWidth = container.clientWidth;
        const headerWidth = activeHeader.offsetWidth;
        const headerLeft = activeHeader.offsetLeft;
        
        // Calculamos la posición de scroll para que la columna quede centrada en la tabla
        const targetScroll = headerLeft - (containerWidth / 2) + (headerWidth / 2);
        
        container.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  }, [activeColumnKey]);

  useEffect(() => {
    if (isMaximized) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMaximized]);

  const handleAddRow = () => {
    if (isReviewMode) return;
    const newRow = columns.reduce(
      (acc, col) => ({ ...acc, [col.key]: col.type === 'boolean' ? false : '' }),
      { _id: uuidv4() } as Record<string, any>
    );
    onChange([...(data || []), newRow], columns);
  };

  const handleRemoveRow = (rowId: string) => {
    if (isReviewMode) return;
    const row = (data || []).find(r => r._id === rowId);
    if (row?._isFixed) return;

    const nextData = (data || []).filter((row) => row._id !== rowId);
    onChange(nextData, columns);
  };

  const handleAddColumn = () => {
    if (isReviewMode) return;
    const newColName = prompt("Nombre de la nueva columna (ej: 'Observación'):");
    if (!newColName) return;

    const newColKey = newColName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w-]+/g, '');

    if (!newColKey) return;
    if (columns.some((c) => c.key === newColKey)) {
      alert('Ya existe una columna con esa clave.');
      return;
    }

    const newColumn: DynamicTableColumn = {
      key: newColKey,
      label: newColName,
      type: 'text',
      readOnly: false,
      required: false,
    };

    const nextCols = [...columns, newColumn];
    const nextData = (data || []).map((r) => ({ ...r, [newColKey]: '' }));
    onChange(nextData, nextCols);
  };
  
  const handleCellChange = (
    rowId: string,
    columnKey: string,
    newValue: any
  ) => {
    const nextData = (data || []).map((row) => {
      if (row._id !== rowId) return row;
      
      const updatedRow = { ...row, [columnKey]: newValue };

      // Sincronización de detalles de presiones si cambia # Frutos
      if (columnKey === 'n_frutos') {
          const n = parseInt(newValue) || 0;
          let dets = [...(updatedRow.detalles || [])];
          if (dets.length > n) {
              dets = dets.slice(0, n);
          } else {
              while (dets.length < n) {
                  dets.push({ p1: null, p2: null });
              }
          }
          updatedRow.detalles = dets;
      }

      columns.forEach((col) => {
        if (col.calc === 'average') {
          let sum = 0;
          let count = 0;

          columns.forEach((c) => {
            if (c.key === col.key) return;
            if (c.excludeFromCalc) return;
            if (c.type !== 'integer' && c.type !== 'decimal' && c.type !== 'text') return; 
            
            const val = updatedRow[c.key];
            if (val !== '' && val !== null && val !== undefined) {
               const num = parseFloat(val);
               if (!isNaN(num)) {
                 sum += num;
                 count++;
               }
            }
          });

          if (count > 0) {
            updatedRow[col.key] = Math.round((sum / count) * 10) / 10;
          } else {
            updatedRow[col.key] = '';
          }
        }
      });

      return updatedRow;
    });
    onChange(nextData, columns);
  };

  const handleOpenPressureModal = (row: any) => {
      // El número de frutos se define por row.n_frutos
      const n = parseInt(row.n_frutos) || 0;
      let detallesData = [...(row.detalles || [])];
      
      // Aseguramos sincronía antes de abrir por si hubo cambios sin abrir modal
      if (detallesData.length > n) {
          detallesData = detallesData.slice(0, n);
      } else {
          while (detallesData.length < n) {
              detallesData.push({ p1: null, p2: null });
          }
      }
      
      setPressureModalState({ 
          isOpen: true, 
          rowId: row._id,
          rowData: { ...row, n_frutos: n, detalles: detallesData }
      });
  };

  const handleSavePressure = (entry: any) => {
      if (!pressureModalState?.rowId) return;
      const nextData = (data || []).map(r => 
          r._id === pressureModalState.rowId ? { ...r, detalles: entry.detalles } : r
      );
      onChange(nextData, columns);
      setPressureModalState(null);
  };

  const handleOpenFindingsModal = (row: any) => {
      setFindingsModalState({ 
          isOpen: true, 
          rowId: row._id,
          rowData: { ...row }
      });
  };

  const handleSaveFindings = (updatedRow: any) => {
      if (!findingsModalState?.rowId) return;
      const nextData = (data || []).map(r => 
          r._id === findingsModalState.rowId ? updatedRow : r
      );
      onChange(nextData, columns);
      setFindingsModalState(null);
  };

  const renderCellInput = (
    column: DynamicTableColumn,
    row: Record<string, any>
  ) => {
    const value = row[column.key];
    const rowId = row._id;
    const isActive = activeColumnKey === column.key;
    
    const isFixedParam = row._isFixed && 
                        (column.key === 'parametro' || column.key === 'calibre' || column.key === 'concepto' || column.key === 'defecto') &&
                        column.readOnly !== false;

    const isCalculated = !!column.calc;
    const isReadOnlyRow = !!row._isReadOnlyRow && column.key !== 'parametro' && column.key !== 'calibre' && column.key !== 'concepto' && column.key !== 'defecto';
    
    // EXCEPCIÓN: Si la fila tiene _rowOptions, el selector DEBE estar habilitado a menos que sea ReviewMode
    const hasRowOptions = !!row._rowOptions?.[column.key];
    const disabled = (column.readOnly === true || isReviewMode === true || isFixedParam || isCalculated || isReadOnlyRow) && !hasRowOptions;
    
    const min = column.validations?.min;
    const max = column.validations?.max;
    const step = getStepFromValidations(column);

    const cellKey = `${rowId}-${column.key}`;

    const handleInteraction = () => {
      // FIX: Se incluye 'f' en la expresión regular para detectar columnas de Fruta (C.K.U Presizer Paso 5)
      const isTrackableCol = (column.key.startsWith('l') || column.key.startsWith('c') || column.key.startsWith('ch') || column.key.startsWith('f')) && !isNaN(parseInt(column.key.replace(/^\D+/, '')));
      if (isTrackableCol && onActiveColumnChange && activeColumnKey !== column.key) {
        onActiveColumnChange(column.key);
      }
    };

    // Resaltado de umbral de peso (solo para columnas de peso c1..c10)
    const isWeightCell = column.key.startsWith('c') && !isNaN(parseInt(column.key.substring(1)));
    const numericValue = parseFloat(value);
    const belowThreshold = highlightThreshold !== undefined && isWeightCell && !isNaN(numericValue) && numericValue < highlightThreshold;

    const commonProps = {
      disabled: disabled || isReviewMode,
      onFocus: handleInteraction,
      onClick: handleInteraction,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { value: eventValue, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : eventValue;
        handleCellChange(rowId, column.key, newValue);
      },
      'aria-readonly': disabled ? true : undefined,
    };
    
    const baseInputClasses = `block w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-cku-blue focus:border-cku-blue text-base sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-gray-900 caret-gray-900 min-h-[42px] transition-all ${isFixedParam ? 'font-medium bg-gray-50' : 'bg-white'} ${isActive ? 'ring-2 ring-inset ring-cku-blue/40 border-cku-blue/40' : 'border-gray-300'} ${belowThreshold ? 'bg-red-50 !text-red-700 !border-red-400 !ring-red-200' : ''}`;
    const baseSelectClasses = `appearance-none block w-full pl-3 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-cku-blue focus:border-cku-blue text-base sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-gray-900 min-h-[42px] ${isActive ? '!bg-blue-50/50 ring-2 ring-inset ring-cku-blue/40 border-cku-blue/40' : ''}`;

    // Si la fila tiene opciones específicas para esta columna, renderizamos un SELECT independientemente del tipo de la columna
    const rowOptions = row._rowOptions?.[column.key];
    if (rowOptions || column.type === 'select') {
        const options = rowOptions || column.options;
        return (
          <div className="relative">
            <select {...commonProps} value={value ?? ''} key={cellKey} className={baseSelectClasses}>
              <option value="">Seleccionar...</option>
              {options?.map((opt: string) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
              aria-hidden="true"
            />
          </div>
        );
    }

    switch (column.type) {
      case 'integer':
      case 'decimal':
        return (
          <input
            type="number"
            className={baseInputClasses}
            inputMode={column.type === 'integer' ? 'numeric' : 'decimal'}
            step={step}
            min={min}
            max={max}
            {...commonProps}
            value={value ?? ''}
            key={cellKey}
            autoComplete="off"
          />
        );

      case 'date':
      case 'time':
        return (
          <div className="relative custom-date-container">
            <input
              type={column.type}
              className={`${baseInputClasses} ${column.type === 'date' ? 'date-input-field pr-10' : ''}`}
              {...commonProps}
              value={value ?? ''}
              key={cellKey}
              autoComplete="off"
            />
            {column.type === 'date' && (
              <div 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                aria-hidden="true"
              >
                <CalendarIcon className="w-4 h-4" />
              </div>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className={`flex justify-center items-center h-[42px] rounded-lg ${isActive ? 'bg-blue-100/50 ring-2 ring-inset ring-cku-blue/40' : ''}`}>
            <input
              type="checkbox"
              className="h-6 w-6 rounded border-gray-300 text-cku-blue focus:ring-cku-blue disabled:opacity-50 cursor-pointer"
              checked={!!value}
              {...commonProps}
              key={cellKey}
            />
          </div>
        );

      case 'pressure_button':
        const nFrutosVal = parseInt(row.n_frutos);
        const isPressureDisabled = isReviewMode || isNaN(nFrutosVal) || nFrutosVal <= 0;
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleOpenPressureModal(row)}
            disabled={isPressureDisabled}
            className="text-cku-blue hover:bg-blue-50 border border-transparent hover:border-blue-100 w-full font-bold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <EditIcon className="w-4 h-4 mr-2"/> Registrar / Ver presiones
          </Button>
        );

      case 'findings_button':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleOpenFindingsModal(row)}
            className="text-cku-blue hover:bg-blue-50 border border-transparent hover:border-blue-100 w-full font-bold"
          >
            <EditIcon className="w-4 h-4 mr-2"/> Registrar / Ver hallazgos
          </Button>
        );

      case 'text':
      default:
        return <input type="text" {...commonProps} value={value ?? ''} key={cellKey} autoComplete="off" className={baseInputClasses} />;
    }
  };

  const renderTableContent = () => (
    <>
      <div 
        ref={scrollContainerRef}
        className={`overflow-x-auto border border-gray-300 rounded-lg shadow-sm ${isMaximized ? 'h-full flex flex-col' : ''}`}
      >
        <table className="min-w-full bg-white divide-y divide-gray-200">
          <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
            <tr>
              {columns.map((col) => {
                // FIX: Se incluye 'f' en la expresión regular para detectar columnas de Fruta (C.K.U Presizer Paso 5)
                const isTrackableCol = (col.key.startsWith('l') || col.key.startsWith('c') || col.key.startsWith('ch') || col.key.startsWith('f')) && !isNaN(parseInt(col.key.replace(/^\D+/, '')));
                const isActive = activeColumnKey === col.key;

                return (
                  <th
                    key={col.key}
                    data-colkey={col.key}
                    onClick={() => isTrackableCol && onActiveColumnChange?.(col.key)}
                    className={`py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${getCellWidthClass(col.type)} ${isActive ? 'bg-cku-blue text-white shadow-lg ring-2 ring-cku-blue scale-[1.02] z-20' : 'text-gray-600'} ${isTrackableCol ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                    scope="col"
                  >
                    {col.label}
                  </th>
                );
              })}
              {!isReviewMode && <th className="w-14 min-w-[56px] bg-gray-100 sticky right-0 z-20 shadow-[-4px_0_4px_-4px_rgba(0,0,0,0.1)] border-l border-gray-200" />}
            </tr>
          </thead>
          <tbody className={`divide-y divide-gray-200 ${isMaximized ? 'flex-grow' : ''}`}>
            {(data || []).map((row, rowIndex) => (
              <tr key={row._id || rowIndex}>
                {columns.map((col) => {
                  const isActive = activeColumnKey === col.key;
                  return (
                    <td 
                      key={col.key} 
                      className={`py-2 px-3 whitespace-nowrap align-middle transition-colors duration-200 ${getCellWidthClass(col.type)} ${isActive ? 'bg-blue-100/20 border-x-2 border-cku-blue/30' : 'border-x border-transparent'}`}
                    >
                      {renderCellInput(col, row)}
                    </td>
                  );
                })}
                {!isReviewMode && (
                  <td className="py-2 px-2 text-center align-middle w-14 sticky right-0 bg-white shadow-[-4px_0_4px_-4px_rgba(0,0,0,0.1)] border-l border-gray-200 z-10">
                    {!row._isFixed ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row._id)}
                        className="text-gray-400 hover:text-cku-red transition-colors p-2 rounded-md hover:bg-red-50"
                        aria-label="Eliminar fila"
                        title="Eliminar fila"
                      >
                        <Trash2Icon className="w-5 h-5" />
                      </button>
                    ) : (
                      <span className="block w-5 h-5" /> 
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {canAddRows && !isReviewMode && (
          <Button variant="secondary" onClick={handleAddRow} className="flex-1 sm:flex-none justify-center">
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Añadir Fila
          </Button>
        )}
        {canAddCols && !isReviewMode && (
          <Button variant="secondary" onClick={handleAddColumn} className="flex-1 sm:flex-none justify-center">
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Añadir Columna
          </Button>
        )}
      </div>

      <PressureDetailModal
        isOpen={!!pressureModalState?.isOpen}
        onClose={() => setPressureModalState(null)}
        onSave={handleSavePressure}
        entry={pressureModalState?.rowData || null}
        isEditable={!isReviewMode}
      />

      <FindingsDetailModal
        isOpen={!!findingsModalState?.isOpen}
        onClose={() => setFindingsModalState(null)}
        onSave={handleSaveFindings}
        row={findingsModalState?.rowData || null}
        isEditable={!isReviewMode}
      />
    </>
  );

  if (isMaximized) {
      return (
          <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-fade-in">
              <div className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center shadow-sm flex-shrink-0 z-50">
                  <div className="mr-4 overflow-hidden">
                      <h3 className="text-base sm:text-lg font-bold text-cku-blue truncate" title={label || 'Vista Ampliada'}>{label || 'Vista Ampliada'}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Modo pantalla completa para edición cómoda</p>
                  </div>
                  <Button variant="secondary" onClick={() => setIsMaximized(false)} className="flex-shrink-0 whitespace-nowrap">
                      <MinimizeIcon className="w-5 h-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Cerrar Vista</span>
                      <span className="sm:hidden">Cerrar</span>
                  </Button>
              </div>
              <div className="flex-grow overflow-auto p-2 sm:p-6 bg-gray-50">
                  <div className="max-w-[1920px] mx-auto h-full flex flex-col">
                     {renderTableContent()}
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="w-full relative group">
       <div className="flex justify-end mb-2">
           <button 
                type="button" 
                onClick={() => setIsMaximized(true)} 
                className="text-gray-500 hover:text-cku-blue hover:bg-blue-50 px-2 py-1 rounded-md transition-colors flex items-center text-xs font-semibold uppercase tracking-wide"
                title="Maximizar tabla para mejor visualización"
            >
               <MaximizeIcon className="w-4 h-4 mr-1.5" />
               Maximizar Tabla
           </button>
       </div>
      {renderTableContent()}
    </div>
  );
};