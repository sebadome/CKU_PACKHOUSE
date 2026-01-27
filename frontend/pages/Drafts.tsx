import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormSubmission, FormTemplate } from '../types';
import { Button } from '../components/ui/Button';
import { EditIcon, Trash2Icon } from '../components/Icons';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface DraftsProps {
  submissions: FormSubmission[];
  templates: FormTemplate[];
  deleteSubmission: (id: string) => void;
}

const Drafts: React.FC<DraftsProps> = ({ submissions, templates, deleteSubmission }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [draftToDelete, setDraftToDelete] = useState<{id: string, title: string} | null>(null);
  
  const drafts = submissions.filter(s => s.status === 'Borrador');

  const handleDeleteClick = (id: string, title: string) => {
      setDraftToDelete({ id, title });
  };

  const confirmDelete = () => {
      if (draftToDelete) {
          deleteSubmission(draftToDelete.id);
          addToast({ message: "Borrador eliminado correctamente", type: "success" });
          setDraftToDelete(null);
      }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader 
        title="Mis Borradores"
        description="Aquí puede encontrar todos sus registros guardados que aún no han sido enviados."
        breadcrumbs={[{ label: 'Inicio', path: '/' }, { label: 'Borradores'}]}
      />
      
      <div className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200">
        {drafts.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {drafts.map(draft => {
              const template = templates.find(t => t.id === draft.templateId);
              // Priorizamos el nombre personalizado, si no existe usamos el título de la plantilla
              const title = draft.customName || template?.title || 'Sin Título';
              return (
                <li key={draft.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 gap-4">
                  <div>
                    <p className="font-semibold text-cku-blue">{title}</p>
                    <p className="text-sm text-gray-500">
                      {draft.data.productor || 'Sin productor'} - Modificado: {new Date(draft.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button variant="secondary" onClick={() => navigate(`/forms/fill/${draft.id}`)}>
                        <EditIcon className="w-4 h-4 mr-2" /> Continuar
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={() => handleDeleteClick(draft.id, title)}
                        title="Eliminar borrador"
                        className="px-3"
                    >
                        <Trash2Icon className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-gray-900">No tiene borradores</h3>
            <p className="mt-1 text-sm text-gray-500">Comience un nuevo registro desde la página de inicio.</p>
            <div className="mt-6">
              <Button onClick={() => navigate('/')}>Ir a Inicio</Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!draftToDelete}
        onClose={() => setDraftToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar Borrador"
        message={`¿Estás seguro de que deseas eliminar el borrador de "${draftToDelete?.title}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        submittingText="Eliminando..."
      />
    </div>
  );
};

export default Drafts;