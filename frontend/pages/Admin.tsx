import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FormTemplate } from '../types';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/PageHeader';
import { PlusCircleIcon } from '../components/Icons';

interface AdminProps {
  templates: FormTemplate[];
}

const Admin: React.FC<AdminProps> = ({ templates }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Administración de Plantillas"
        description="Cree, edite y gestione las plantillas del sistema."
        breadcrumbs={[{ label: 'Inicio', path: '/' }, { label: 'Administración'}]}
      >
        <Button onClick={() => navigate('/admin/templates/new')}>
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Nueva Plantilla
        </Button>
      </PageHeader>
      
      <div className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Versión</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map(template => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{template.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">v{template.version}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        template.status === 'Publicada' ? 'bg-green-100 text-green-800' :
                        template.status === 'Deprecada' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                        {template.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="secondary" onClick={() => navigate(`/admin/templates/${template.id}`)}>
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
