// pages/TemplateBuilder.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormTemplate, TemplateStatus, FormSection, FormField } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../context/ToastContext';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { PlusCircleIcon, SaveIcon, Trash2Icon, EditIcon, ArrowUpIcon, ArrowDownIcon } from '../components/Icons';
import { v4 as uuidv4 } from 'uuid';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useNavigationBlocker } from '../context/NavigationBlockerContext';
import { SectionEditorModal } from '../components/SectionEditorModal';
import { FieldEditorDrawer } from '../components/FieldEditorDrawer';

// FIX: Define props interface for TemplateBuilder
interface TemplateBuilderProps {
  findTemplate: (id: string) => FormTemplate | undefined;
  updateTemplate: (template: FormTemplate) => void;
}

// NEW: Helper para sanitizar keys
const slugify = (text: string) =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '_');

// NEW: Helper para obtener una plantilla nueva
const getNewTemplate = (): FormTemplate => ({
    id: uuidv4(),
    title: 'Nueva Plantilla',
    description: '',
    version: '1.0',
    status: 'Borrador',
    tags: [],
    sections: [],
});

// NEW: Helper de validación
const validateTemplate = (template: FormTemplate): { ok: boolean, errors: string[] } => {
    const errors: string[] = [];
    if (!template.title.trim()) errors.push('El título de la plantilla no puede estar vacío.');
    
    const allKeys = new Set<string>();
    template.sections.forEach((section, sIdx) => {
        if (!section.title.trim()) errors.push(`La sección #${sIdx + 1} no tiene título.`);
        section.fields.forEach((field, fIdx) => {
            if (!field.label.trim()) errors.push(`El campo #${fIdx + 1} en la sección "${section.title}" no tiene etiqueta.`);
            if (!field.key.trim()) errors.push(`El campo "${field.label}" no tiene clave (key).`);
            if (allKeys.has(field.key)) errors.push(`La clave (key) "${field.key}" está duplicada.`);
            allKeys.add(field.key);
        });
    });

    return { ok: errors.length === 0, errors };
}

// NEW: Tipo para el estado de edición
type EditState = 
  | { mode: 'addSection' | 'editSection', sectionId?: string }
  | { mode: 'addField' | 'editField', sectionId: string, fieldId?: string }
  | null;


const TemplateBuilder: React.FC<TemplateBuilderProps> = ({ findTemplate, updateTemplate }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { blockNavigation, isNavigationBlocked } = useNavigationBlocker();

  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [editState, setEditState] = useState<EditState>(null);
  const [deleteState, setDeleteState] = useState<{ type: 'section' | 'field', sectionId: string, fieldId?: string } | null>(null);

  // Carga e "hidrata" la plantilla con IDs y órdenes
  useEffect(() => {
    const isNew = !id || id === 'new';
    let loadedTemplate = isNew ? getNewTemplate() : findTemplate(id!);

    if (loadedTemplate) {
        // NEW: "Hidratación" para asegurar IDs y órdenes
        let hasChanges = false;
        const hydratedSections = loadedTemplate.sections.map((section, sIdx) => {
            const sectionId = section.id || uuidv4();
            if (!section.id) hasChanges = true;
            
            const hydratedFields = section.fields.map((field, fIdx) => {
                const fieldId = field.id || uuidv4();
                if (!field.id) hasChanges = true;
                return { ...field, id: fieldId, order: field.order ?? fIdx };
            });

            hydratedFields.sort((a, b) => a.order! - b.order!);
            return { ...section, id: sectionId, fields: hydratedFields, order: section.order ?? sIdx };
        });
        
        hydratedSections.sort((a, b) => a.order! - b.order!);

        setTemplate({ ...loadedTemplate, sections: hydratedSections });
        // Si es plantilla nueva, marcamos como "sucio" para forzar guardado
        if (isNew || hasChanges) setIsDirty(true);

    } else if (!isNew) {
        setTemplate(null);
    }
  }, [id, findTemplate]);

  // Sincroniza el estado "sucio" con el bloqueador de navegación
  useEffect(() => {
    blockNavigation(isDirty);
  }, [isDirty, blockNavigation]);

  // Listener para `beforeunload`
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  // NEW: Función genérica para actualizar la plantilla y marcar como "sucio"
  const updateLocalTemplate = (updater: (prev: FormTemplate) => FormTemplate) => {
    setTemplate(prev => prev ? updater(prev) : null);
    setIsDirty(true);
  };
  
  // Lógica de guardado
  const handleSave = () => {
    if (!template) return;

    const { ok, errors } = validateTemplate(template);
    if (!ok) {
        addToast({ message: `Errores de validación: ${errors.join(', ')}`, type: 'error' });
        return;
    }

    const templateToSave = {
        ...template,
        sections: template.sections.map(s => ({
            ...s,
            fields: s.fields.map(f => ({...f}))
        }))
    };
    
    updateTemplate(templateToSave);
    addToast({ message: 'Plantilla guardada con éxito', type: 'success' });
    setIsDirty(false);
    
    if (!id || id === 'new') {
        navigate(`/admin/templates/${template.id}`, { replace: true });
    }
  };

  // --- Lógica de Secciones ---
  const handleSaveSection = (sectionData: { title: string, description?: string }) => {
    if (!editState || (editState.mode !== 'addSection' && editState.mode !== 'editSection')) return;
    
    if (editState.mode === 'addSection') {
        const newSection: FormSection = {
            id: uuidv4(),
            key: slugify(sectionData.title),
            title: sectionData.title,
            description: sectionData.description,
            fields: [],
            order: (template?.sections.length || 0),
        };
        updateLocalTemplate(prev => ({...prev, sections: [...prev.sections, newSection]}));
    } else { // editSection
        updateLocalTemplate(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === editState.sectionId ? {...s, ...sectionData} : s)
        }));
    }
    setEditState(null);
  };
  
  const handleMove = (type: 'section' | 'field', direction: 'up' | 'down', sectionId: string, fieldId?: string) => {
    updateLocalTemplate(prev => {
        const newTemplate = JSON.parse(JSON.stringify(prev));
        const list = type === 'section' ? newTemplate.sections : newTemplate.sections.find((s: FormSection) => s.id === sectionId)!.fields;
        const itemIndex = list.findIndex((item: any) => item.id === (fieldId || sectionId));
        if ((direction === 'up' && itemIndex === 0) || (direction === 'down' && itemIndex === list.length - 1)) {
            return newTemplate;
        }

        const swapIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
        [list[itemIndex].order, list[swapIndex].order] = [list[swapIndex].order, list[itemIndex].order];
        list.sort((a: any, b: any) => a.order - b.order);
        return newTemplate;
    });
  };

  const confirmDelete = () => {
    if (!deleteState) return;
    if (deleteState.type === 'section') {
        updateLocalTemplate(prev => ({...prev, sections: prev.sections.filter(s => s.id !== deleteState.sectionId)}));
        addToast({ message: 'Sección eliminada', type: 'success' });
    } else { // field
        updateLocalTemplate(prev => ({
            ...prev,
            sections: prev.sections.map(s => 
                s.id === deleteState.sectionId 
                ? {...s, fields: s.fields.filter(f => f.id !== deleteState.fieldId)}
                : s
            )
        }));
        addToast({ message: 'Campo eliminado', type: 'success' });
    }
    setDeleteState(null);
  };

  // --- Lógica de Campos ---
  const handleSaveField = (fieldData: FormField) => {
    if (!editState || (editState.mode !== 'addField' && editState.mode !== 'editField')) return;

    if(editState.mode === 'addField') {
        const newField: FormField = {
            ...fieldData,
            id: uuidv4(),
            order: template?.sections.find(s => s.id === editState.sectionId)?.fields.length || 0,
        };
        updateLocalTemplate(prev => ({
            ...prev,
            sections: prev.sections.map(s => 
                s.id === editState.sectionId 
                ? {...s, fields: [...s.fields, newField]} 
                : s
            )
        }));
    } else { // editField
        updateLocalTemplate(prev => ({
            ...prev,
            sections: prev.sections.map(s => 
                s.id === editState.sectionId 
                ? {...s, fields: s.fields.map(f => f.id === editState.fieldId ? fieldData : f)}
                : s
            )
        }));
    }
    setEditState(null);
  }

  if (!template) {
    return (
        <div className="text-center p-10">
            <h2 className="text-2xl font-bold">Plantilla no encontrada</h2>
            <p className="text-gray-600 mt-2">La plantilla que busca no existe o fue eliminada.</p>
            <Button onClick={() => navigate('/admin')} className="mt-4">Volver a Administración</Button>
        </div>
    );
  }

  const allFieldKeys = template.sections.flatMap(s => s.fields.map(f => f.key));

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title={!id || id === 'new' ? "Crear Nueva Plantilla" : "Editor de Plantilla"}
          breadcrumbs={[
              { label: 'Inicio', path: '/' },
              { label: 'Administración', path: '/admin'},
              { label: template.title }
          ]}
        >
          <Button onClick={handleSave} disabled={!isDirty}><SaveIcon className="w-5 h-5 mr-2"/>Guardar Cambios</Button>
        </PageHeader>
        
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Título de la Plantilla" value={template.title} onChange={e => updateLocalTemplate(p => ({...p, title: e.target.value}))} />
                <Input label="Descripción" value={template.description} onChange={e => updateLocalTemplate(p => ({...p, description: e.target.value}))} />
                <Input label="Versión" value={template.version} onChange={e => updateLocalTemplate(p => ({...p, version: e.target.value}))} />
                <Select label="Estado" value={template.status} onChange={e => updateLocalTemplate(p => ({...p, status: e.target.value as TemplateStatus}))}>
                    <option value="Borrador">Borrador</option>
                    <option value="Publicada">Publicada</option>
                    <option value="Deprecada">Deprecada</option>
                </Select>
            </CardContent>
        </Card>

        {template.sections.map((section) => (
          <Card key={section.id} className="mb-6">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>{section.title}</CardTitle>
              <div className="flex items-center gap-2">
                 {/* NEW: Reordenamiento de secciones */}
                 <Button variant="ghost" size="sm" onClick={() => handleMove('section', 'up', section.id!)}><ArrowUpIcon className="w-4 h-4"/></Button>
                 <Button variant="ghost" size="sm" onClick={() => handleMove('section', 'down', section.id!)}><ArrowDownIcon className="w-4 h-4"/></Button>
                 <Button variant="ghost" size="sm" onClick={() => setEditState({ mode: 'editSection', sectionId: section.id })}><EditIcon className="w-4 h-4"/></Button>
                 <Button variant="destructive" size="sm" onClick={() => setDeleteState({ type: 'section', sectionId: section.id! })}><Trash2Icon className="w-4 h-4"/></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.fields.map((field) => (
                <div key={field.id} className="p-4 border rounded-lg bg-gray-50 flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{field.label} <span className="font-normal text-gray-500">({field.key})</span></p>
                    <p className="text-sm"><strong>Tipo:</strong> <span className="font-mono bg-gray-200 px-1 rounded">{field.type}</span> {field.required && <span className="text-cku-red font-semibold"> *Requerido</span>}</p>
                  </div>
                  <div className="flex items-center gap-2">
                      {/* NEW: Reordenamiento de campos */}
                      <Button variant="ghost" size="sm" onClick={() => handleMove('field', 'up', section.id!, field.id!)}><ArrowUpIcon className="w-4 h-4"/></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleMove('field', 'down', section.id!, field.id!)}><ArrowDownIcon className="w-4 h-4"/></Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditState({ mode: 'editField', sectionId: section.id!, fieldId: field.id! })}><EditIcon className="w-4 h-4"/></Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteState({ type: 'field', sectionId: section.id!, fieldId: field.id! })}><Trash2Icon className="w-4 h-4"/></Button>
                  </div>
                </div>
              ))}
              <Button variant="secondary" onClick={() => setEditState({ mode: 'addField', sectionId: section.id! })}><PlusCircleIcon className="w-5 h-5 mr-2"/> Añadir Campo</Button>
            </CardContent>
          </Card>
        ))}
        <Button onClick={() => setEditState({ mode: 'addSection' })}><PlusCircleIcon className="w-5 h-5 mr-2"/> Añadir Sección</Button>
      </div>

      {/* NEW: Modales de edición */}
      <SectionEditorModal 
        isOpen={editState?.mode === 'addSection' || editState?.mode === 'editSection'}
        onClose={() => setEditState(null)}
        onSave={handleSaveSection}
        section={editState?.mode === 'editSection' ? template.sections.find(s => s.id === editState.sectionId) : undefined}
      />
      
      <FieldEditorDrawer
        isOpen={editState?.mode === 'addField' || editState?.mode === 'editField'}
        onClose={() => setEditState(null)}
        onSave={handleSaveField}
        field={editState?.mode === 'editField' ? template.sections.find(s => s.id === editState.sectionId)?.fields.find(f => f.id === editState.fieldId) : undefined}
        existingKeys={allFieldKeys}
        slugifyFn={slugify}
      />

      <ConfirmDialog
        isOpen={!!deleteState}
        onClose={() => setDeleteState(null)}
        onConfirm={confirmDelete}
        title={`Eliminar ${deleteState?.type === 'section' ? 'Sección' : 'Campo'}`}
        message={`¿Está seguro de que desea eliminar este elemento? Esta acción no se puede deshacer.`}
      />
    </>
  );
};

export default TemplateBuilder;