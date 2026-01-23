// pages/Library.tsx
import React, { useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormSubmission, FormTemplate, FormStatus } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/PageHeader';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { AuthContext } from '../context/AuthContext';

interface LibraryProps {
  submissions: FormSubmission[];
  templates: FormTemplate[];
}

const Library: React.FC<LibraryProps> = ({ submissions, templates }) => {
  const navigate = useNavigate();
  const { user, role } = useContext(AuthContext);

  const [statusFilter, setStatusFilter] = useState<FormStatus | 'todos'>('todos');
  const [templateFilter, setTemplateFilter] = useState<string>('todos');
  const [dateFilter, setDateFilter] = useState('');
  
  const mySubmissions = useMemo(() => {
    return submissions
      .filter(s => s.submittedBy === user?.name && s.status !== 'Borrador')
      .filter(s => statusFilter === 'todos' || s.status === statusFilter)
      .filter(s => templateFilter === 'todos' || s.templateId === templateFilter)
      .filter(s => !dateFilter || s.createdAt.startsWith(dateFilter))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [submissions, user?.name, statusFilter, templateFilter, dateFilter]);

  const uniqueTemplates = useMemo(() => {
    // Para el trabajador, solo mostramos en el filtro plantillas que estén Publicadas 
    // o de las que ya tenga registros (aunque se hayan deprecado para mantener acceso histórico)
    const templateIdsWithSubmissions = new Set(mySubmissions.map(s => s.templateId));
    
    return templates.filter(t => 
      t.status === 'Publicada' || 
      templateIdsWithSubmissions.has(t.id)
    );
  }, [mySubmissions, templates]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Mi Biblioteca de Registros"
        description="Vea todos sus registros históricos ingresados."
        breadcrumbs={[{ label: 'Inicio', path: '/' }, { label: 'Biblioteca'}]}
      />

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
        <Select value={templateFilter} onChange={e => setTemplateFilter(e.target.value)}>
            <option value="todos">Todas las Plantillas</option>
            {uniqueTemplates.map(t => <option key={t.id} value={t.id}>{t.title} {t.status === 'Deprecada' ? '(Obsoleta)' : ''}</option>)}
        </Select>
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
      </div>
      
      <div className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identificación / Plantilla</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Ingreso</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mySubmissions.length > 0 ? mySubmissions.map(submission => {
                const template = templates.find(t => t.id === submission.templateId);
                return (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="font-bold">{submission.customName || template?.title || 'N/A'}</div>
                        {submission.customName && <div className="text-xs text-gray-400 font-normal">{template?.title}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(submission.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge status={submission.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button variant="ghost" onClick={() => navigate(`/forms/fill/${submission.id}`)}>Ver Detalle</Button>
                    </td>
                  </tr>
                )
              }) : (
                  <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-500">No tienes registros que coincidan con los filtros.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Library;