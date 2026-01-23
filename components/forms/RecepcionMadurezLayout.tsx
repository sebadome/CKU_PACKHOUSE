import React from 'react';
import { FormTemplate, FormSubmission, FormField } from '../../types';
import _ from 'lodash';
import { DynamicTable } from '../DynamicTable';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface LayoutProps {
  template: FormTemplate;
  submission: FormSubmission;
  handleDataChange: (key: string, value: any, extraData?: any) => void;
  isEditable: boolean;
}

const findField = (template: FormTemplate, key: string): FormField | undefined => {
  for (const section of template.sections) {
    const field = section.fields.find(f => f.key === key);
    if (field) return field;
  }
  return undefined;
};

const RenderField: React.FC<{
  field: FormField;
  value: any;
  onChange: (key: string, value: any, extraData?: any) => void;
  isEditable: boolean;
}> = ({ field, value, onChange, isEditable }) => {
  const disabled = !isEditable || field.readOnly;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange(field.key, e.target.value);
  };

  switch (field.type) {
    case "text":
    case "date":
    case "time":
      return <Input type={field.type} value={value ?? ""} onChange={handleInputChange} disabled={disabled} />;
    case "integer":
      return <Input type="number" step="1" value={value ?? ""} onChange={handleInputChange} disabled={disabled} />;
    case "decimal":
      return <Input type="number" step="any" value={value ?? ""} onChange={handleInputChange} disabled={disabled} />;
    case "select":
      return (
        <Select value={value ?? ""} onChange={handleInputChange} disabled={disabled}>
          <option value="">-- Seleccionar --</option>
          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </Select>
      );
    case "boolean":
       return (
        <div className="flex items-center h-full">
            <input type="checkbox" checked={!!value} onChange={e => onChange(field.key, e.target.checked)} disabled={disabled} className="h-5 w-5 rounded border-gray-300 text-cku-blue focus:ring-cku-blue" />
        </div>
       );
    case "textarea":
        return <textarea rows={3} value={value ?? ""} onChange={handleInputChange} disabled={disabled} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-cku-blue focus:border-cku-blue sm:text-sm" />;
    case "dynamic_table":
        return <DynamicTable columns={field.columns || []} data={value || []} onChange={(data, cols) => onChange(field.key, data, { newColumns: cols })} canAddRows={field.user_can_add_rows} isReviewMode={!isEditable} />;
    default:
      return <span className="text-red-500 text-xs">Unsupported field type</span>;
  }
};

const FieldWrapper: React.FC<{
    template: FormTemplate;
    submission: FormSubmission;
    fieldKey: string;
    isEditable: boolean;
    handleDataChange: (key: string, value: any) => void;
    children?: React.ReactNode;
}> = ({ template, submission, fieldKey, isEditable, handleDataChange, children }) => {
    const field = findField(template, fieldKey);
    if (!field) return <div className="text-red-500 text-xs p-2 bg-red-50">Field '{fieldKey}' not found</div>;
    return (
        <div>
            <label className="block text-sm font-semibold text-cku-black mb-1">{field.label}</label>
            {children ? children : (
                <RenderField field={field} value={_.get(submission.data, field.key)} onChange={handleDataChange} isEditable={isEditable} />
            )}
        </div>
    );
};

const RecepcionMadurezLayout: React.FC<LayoutProps> = ({ template, submission, handleDataChange, isEditable }) => {

    const FW = (props: { fieldKey: string, children?: React.ReactNode }) => (
        <FieldWrapper 
            template={template} 
            submission={submission} 
            fieldKey={props.fieldKey} 
            isEditable={isEditable} 
            handleDataChange={handleDataChange}
        >
          {props.children}
        </FieldWrapper>
    );

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-gray-200 space-y-6">
      {/* A) Encabezado y B) Franja Central */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-cku-blue text-center flex-grow">RECEPCIÓN MADUREZ POMÁCEAS</h1>
            <div className="text-right text-sm space-y-1 w-48">
                <div className="flex">
                    <span className="font-bold w-24">CÓDIGO:</span>
                    <span className="flex-1">{_.get(submission.data, 'encabezado.codigo_formulario')}</span>
                </div>
                 <div className="flex">
                    <span className="font-bold w-24">VERSIÓN:</span>
                    <span className="flex-1">{_.get(submission.data, 'encabezado.version_formulario')}</span>
                </div>
                <div className="flex items-center">
                    <label className="font-bold w-24" htmlFor="fecha_formulario">FECHA:</label>
                    <RenderField field={findField(template, 'encabezado.fecha_formulario')!} value={_.get(submission.data, 'encabezado.fecha_formulario')} onChange={handleDataChange} isEditable={isEditable} />
                </div>
            </div>
        </div>
        <div className="mt-4 text-center">
            <div className="inline-flex p-1 bg-gray-100 rounded-lg">
                <span className="px-6 py-2 rounded-md bg-cku-blue text-white font-semibold">MANZANAS</span>
                <span className="px-6 py-2 text-gray-400">PERAS</span>
            </div>
        </div>
      </div>

      {/* C, D, E) Bloques de Identificación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* C) Izquierdo */}
          <div className="space-y-3">
              <FW fieldKey="identificacion.codigo" />
              <FW fieldKey="identificacion.productor" />
              <FW fieldKey="identificacion.variedad" />
              <FW fieldKey="identificacion.huerto" />
              <FW fieldKey="identificacion.n_bins" />
              <FW fieldKey="identificacion.tratamiento_producto" />
              <FW fieldKey="identificacion.fogging" />
          </div>

          {/* D) Central */}
          <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <h3 className="font-semibold text-center mb-2">TIPO FRÍO</h3>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                    {["AC-S", "AC-D", "FL", "FL-S", "FC-1", "FC-1S", "FC-3", "FC-3S"].map(key => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-center">{key}</label>
                            <RenderField field={findField(template, `tipo_frio.${key}`)!} value={_.get(submission.data, `tipo_frio.${key}`)} onChange={handleDataChange} isEditable={isEditable} />
                        </div>
                    ))}
                </div>
                 <div className="mt-2"><FW fieldKey="tipo_frio.observacion" /></div>
              </div>
          </div>

          {/* E) Derecho */}
          <div className="space-y-3">
              <div className="p-3 border rounded-lg space-y-2">
                  <h3 className="font-semibold text-center">FOLIO CKU / CARTA DE COSECHA / GUÍA DE ENTRADA</h3>
                   <FW fieldKey="datos_cosecha.folio_cku" />
                   <FW fieldKey="datos_cosecha.n_carta_cosecha" />
                   <FW fieldKey="datos_cosecha.n_guia_entrada" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <FW fieldKey="datos_cosecha.fecha_cosecha" />
                  <FW fieldKey="datos_cosecha.fecha_revision" />
              </div>
              <FW fieldKey="datos_cosecha.hora_ingreso_camion" />
              <div className="grid grid-cols-3 gap-4">
                  <FW fieldKey="datos_cosecha.acidez" />
                  <FW fieldKey="datos_cosecha.ph" />
                  <FW fieldKey="datos_cosecha.gasto_naoh" />
              </div>
              <FW fieldKey="datos_cosecha.n_camara_destino" />
          </div>
      </div>

      {/* F) Resolución */}
      <div className="flex items-center justify-center space-x-6 pt-4 border-t mt-4">
          <div className="w-full max-w-md">
               <FW fieldKey="resolucion.estado" />
          </div>
      </div>
      
      {/* G, H) Madurez, Corazón */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t">
        <FW fieldKey="madurez" />
        <div className="space-y-4">
            <FW fieldKey="matriz_resumen_presiones" />
            <FW fieldKey="matriz_resumen_madurez" />
        </div>
      </div>
      
      {/* I) Parciales */}
      <div className="space-y-4">
          <FW fieldKey="parciales" />
          <FW fieldKey="matriz_resumen_almidon" />
      </div>
      
      {/* J) Textos Libres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FW fieldKey="observaciones_madurez" />
          <FW fieldKey="causal_rechazo" />
      </div>

      {/* K) Firmas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
          <FW fieldKey="firmas.realizado_por" />
          <FW fieldKey="firmas.revisado_por" />
      </div>
    </div>
  );
};

export default RecepcionMadurezLayout;