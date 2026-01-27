import React, { useEffect, useState } from 'react';
import { getDynamicOptions } from '../../dynamicOptions';
import { FormTemplate, FormSubmission, FormField } from '../../types';
import _ from 'lodash';
import { DynamicTable } from '../DynamicTable';
import Input from '../ui/Input';
import Select from '../ui/Select';

// ✅ IMPORT CORRECTO






interface LayoutProps {
  template: FormTemplate;
  submission: FormSubmission;
  handleDataChange: (key: string, value: any, extraData?: any) => void;
  isEditable: boolean;
}

/* =========================
   HELPERS
========================= */

const findField = (
  template: FormTemplate,
  key: string
): FormField | undefined => {
  for (const section of template.sections) {
    const field = section.fields.find((f) => f.key === key);
    if (field) return field;
  }
  return undefined;
};

/* =========================
   RENDER FIELD
========================= */

const RenderField: React.FC<{
  field: FormField;
  value: any;
  onChange: (key: string, value: any, extraData?: any) => void;
  isEditable: boolean;
}> = ({ field, value, onChange, isEditable }) => {
  const disabled = !isEditable || field.readOnly; // Corregido aquí !

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    onChange(field.key, e.target.value);
  };

  switch (field.type) {
    case 'text':
    case 'date':
    case 'time':
      return (
        <Input
          type={field.type}
          value={value ?? ''}
          onChange={handleInputChange}
          disabled={disabled}
        />
      );

    case 'integer':
      return (
        <Input
          type="number"
          step="1"
          value={value ?? ''}
          onChange={handleInputChange}
          disabled={disabled}
        />
      );

    case 'decimal':
      return (
        <Input
          type="number"
          step="any"
          value={value ?? ''}
          onChange={handleInputChange}
          disabled={disabled}
        />
      );

    case 'select':
      return (
        <Select
          value={value ?? ''}
          onChange={handleInputChange}
          disabled={disabled}
        >
          <option value="">-- Seleccionar --</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      );

    case 'boolean':
      return (
        <div className="flex items-center h-full">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(field.key, e.target.checked)}
            disabled={disabled}
            className="h-5 w-5 rounded border-gray-300 text-cku-blue focus:ring-cku-blue"
          />
        </div>
      );

    case 'textarea':
      return (
        <textarea
          rows={3}
          value={value ?? ''}
          onChange={handleInputChange}
          disabled={disabled}
          className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-cku-blue focus:border-cku-blue sm:text-sm"
        />
      );

    case 'dynamic_table':
      return (
        <DynamicTable
          columns={field.columns || []}
          data={value || []}
          onChange={(data, cols) =>
            onChange(field.key, data, { newColumns: cols })
          }
          canAddRows={field.user_can_add_rows}
          isReviewMode={!isEditable}
        />
      );

    default:
      return (
        <span className="text-red-500 text-xs">
          Unsupported field type
        </span>
      );
  }
};

/* =========================
   FIELD WRAPPER
========================= */

const FieldWrapper: React.FC<{
  template: FormTemplate;
  submission: FormSubmission;
  fieldKey: string;
  isEditable: boolean;
  handleDataChange: (key: string, value: any) => void;
  children?: React.ReactNode;
}> = ({
  template,
  submission,
  fieldKey,
  isEditable,
  handleDataChange,
  children,
}) => {
  const field = findField(template, fieldKey);

  if (!field) {
    return (
      <div className="text-red-500 text-xs p-2 bg-red-50">
        Field '{fieldKey}' not found
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-cku-black mb-1">
        {field.label}
      </label>
      {children ? (
        children
      ) : (
        <RenderField
          field={field}
          value={_.get(submission.data, field.key)}
          onChange={handleDataChange}
          isEditable={isEditable}
        />
      )}
    </div>
  );
};

/* =========================
   MAIN LAYOUT
========================= */

const RecepcionMadurezLayout: React.FC<LayoutProps> = ({
  template,
  submission,
  handleDataChange,
  isEditable,
}) => {
  const [variedadesOptions, setVariedadesOptions] = useState<string[]>([]);

  // Asegurarse de inicializar submission.data e identificacion
  submission.data = submission.data || {};
  submission.data.identificacion = submission.data.identificacion || {};

  useEffect(() => {
    let mounted = true;

    getDynamicOptions('variedades')
      .then((opts) => mounted && setVariedadesOptions(opts || []))
      .catch(() => mounted && setVariedadesOptions([]));
     
     

    return () => {
      mounted = false;
    };
  }, []);

  const FW = (props: { fieldKey: string; children?: React.ReactNode }) => (
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
    {/* IDENTIFICACIÓN */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-3">
        <FW fieldKey="identificacion.codigo" />
        <FW fieldKey="identificacion.productor" />

        <FW fieldKey="identificacion.variedad" />
        


       
        
 
        <FW fieldKey="identificacion.n_bins" />
        <FW fieldKey="identificacion.tratamiento_producto" />
        <FW fieldKey="identificacion.fogging" />
      </div>
    </div>
  </div>
);

};
export default RecepcionMadurezLayout;

