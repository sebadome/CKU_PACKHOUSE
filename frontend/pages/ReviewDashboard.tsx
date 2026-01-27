import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormSubmission, FormTemplate } from '../types';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/PageHeader';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/ui/Badge';

interface RecordsLibraryProps {
  submissions: FormSubmission[];
  templates: FormTemplate[];
}

const RecordsLibrary: React.FC<RecordsLibraryProps> = ({ submissions, templates }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // State for filters
  const [templateFilter, setTemplateFilter] = useState<string>('todos');
  const [searchFilter, setSearchFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredSubmissions = useMemo(() => {
    const searchLower = searchFilter.toLowerCase();
    return submissions
      .filter(s => templateFilter === 'todos' || s.templateId === templateFilter)
      .filter(s => !dateFilter || s.createdAt.startsWith(dateFilter))
      .filter(s => !userFilter || s.submittedBy?.toLowerCase().includes(userFilter.toLowerCase()))
      .filter(s => 
        !searchLower || 
        s.data.productor?.toLowerCase().includes(searchLower) ||
        s.data.lote?.toLowerCase().includes(searchLower) ||
        s.customName?.toLowerCase().includes(searchLower)
      );
  }, [submissions, templateFilter, searchFilter, userFilter, dateFilter]);

  const uniqueTemplates = useMemo(() => {
    const templateIds = new Set(submissions.map(s => s.templateId));
    return Array.from(templateIds).map(id => templates.find(t => t.id === id)).filter(Boolean) as FormTemplate[];
  }, [submissions, templates]);
  
  const uniqueUsers = useMemo(() => {
    const users = new Set(submissions.map(s => s.submittedBy).filter(Boolean));
    return Array.from(users);
  }, [submissions]);

  const handleExportCSV = () => {
    addToast({ message: 'Exportación CSV no implementada en esta demo.', type: 'warning' });
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Biblioteca de Registros"
        description="Consulte y filtre todos los registros históricos ingresados en el sistema."
        breadcrumbs={[{ label: 'Inicio', path: '/' }, { label: 'Biblioteca de Registros'}]}
      >
        <Button variant="secondary" onClick={handleExportCSV}>Exportar CSV</Button>
      </PageHeader>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select value={templateFilter} onChange={e => setTemplateFilter(e.target.value)}>
            <option value="todos">Todas las Plantillas</option>
            {uniqueTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </Select>
        <Input type="text" placeholder="Buscar Productor / Lote / Nombre..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} />
        <Select value={userFilter} onChange={e => setUserFilter(e.target.value)}>
            <option value="">Todos los Usuarios</option>
            {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
        </Select>
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
      </div>
      
      <div className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre / Plantilla</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productor / Lote</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubmissions.length > 0 ? filteredSubmissions.map(submission => {
                const template = templates.find(t => t.id === submission.templateId);
                const displayName = submission.customName || template?.title || 'N/A';
                return (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div>{displayName}</div>
                      {submission.customName && <div className="text-xs text-gray-400 font-normal">{template?.title}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{submission.data.productor || ''}{submission.data.lote ? ` - ${submission.data.lote}` : ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(submission.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge status={submission.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{submission.submittedBy || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="secondary" onClick={() => navigate(submission.status === 'Borrador' ? `/forms/fill/${submission.id}` : `/records/${submission.id}`)}>
                        {submission.status === 'Borrador' ? 'Editar' : 'Ver Detalle'}
                      </Button>
                    </td>
                  </tr>
                )
              }) : (
                  <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-500">No hay registros que coincidan con los filtros.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecordsLibrary;