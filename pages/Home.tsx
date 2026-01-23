import React, { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FormTemplate, FormSubmission, UserRole } from '../types';
import {
  FileTextIcon,
  PlusCircleIcon,
  SearchIcon,
  ClockIcon,
  FolderIcon,
  EditIcon,
  XCircleIcon,
} from '../components/Icons';
import { AuthContext } from '../context/AuthContext';
import Input from '../components/ui/Input';
import { PageHeader } from '../components/PageHeader';

interface HomeProps {
  templates: FormTemplate[];
  submissions: FormSubmission[];
}

const getPublishedTemplatesFor = (
  role: UserRole,
  templates: FormTemplate[]
): FormTemplate[] => {
  // Lógica unificada: Solo 'Publicada' para Trabajador CKU. 
  // Administrador puede ver todas en el dashboard de inicio si se desea, 
  // pero para creación de nuevos registros desde Home mantenemos consistencia.
  if (role === 'Administrador') {
    return templates; // Admin ve todo
  }
  return templates.filter(
    (t) =>
      t.status === 'Publicada' &&
      (t.publishedTo ? t.publishedTo.includes(role) : true)
  );
};

const Home: React.FC<HomeProps> = ({ templates, submissions }) => {
  const navigate = useNavigate();
  const { role, user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Filtrar Plantillas disponibles según Rol y Estado
  const publishedTemplates = useMemo(() => {
    if (!role) return [];
    return getPublishedTemplatesFor(role, templates);
  }, [role, templates]);

  // 2. Actividad Reciente (solo para vista por defecto)
  const recentActivity = useMemo(() => {
    let activity = submissions
      .filter((s) => s.status !== 'Borrador')
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    if (role === 'Trabajador CKU') {
      const currentUser = user?.name ?? '';
      activity = activity.filter(
        (s) => s.submittedBy === currentUser
      );
    }

    return activity.slice(0, 5);
  }, [submissions, role, user?.name]);

  // --- LÓGICA DE BÚSQUEDA GLOBAL ---

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase();

    // Función auxiliar para buscar dentro de la data de un formulario
    const matchesSubmissionData = (s: FormSubmission) => {
        const dataStr = [
            s.data.productor,
            s.data.variedad,
            s.data.lote,
            s.data.ot,
            s.data.folio,
            s.data.encabezado?.folio_cku,
            s.data.identificacion?.productor,
            s.planta,
            s.submittedBy,
            s.customName
        ].filter(Boolean).join(' ').toLowerCase();

        return dataStr.includes(term);
    };

    // A. Buscar en Plantillas (Respetando visibilidad por estado)
    const matchedTemplates = publishedTemplates.filter(t => 
        (t.title.toLowerCase().includes(term) || 
        t.tags.some(tag => tag.toLowerCase().includes(term)))
    );

    // B. Buscar en Borradores
    let candidateDrafts = submissions.filter(s => s.status === 'Borrador');
    if (role === 'Trabajador CKU') {
        candidateDrafts = candidateDrafts.filter(s => s.submittedBy === user?.name);
    }
    const matchedDrafts = candidateDrafts.filter(s => matchesSubmissionData(s));

    // C. Buscar en Biblioteca / Registros
    let candidateRecords = submissions.filter(s => s.status === 'Ingresado');
    if (role === 'Trabajador CKU') {
        candidateRecords = candidateRecords.filter(s => s.submittedBy === user?.name);
    }
    const matchedRecords = candidateRecords.filter(s => matchesSubmissionData(s));

    return {
        templates: matchedTemplates,
        drafts: matchedDrafts,
        records: matchedRecords,
        total: matchedTemplates.length + matchedDrafts.length + matchedRecords.length
    };

  }, [searchTerm, publishedTemplates, submissions, role, user?.name]);


  // Renderizado de Resultados de Búsqueda
  const renderSearchResults = () => {
    if (!searchResults) return null;

    if (searchResults.total === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No se encontraron resultados</h3>
                <p className="text-gray-500">Intenta con otros términos como productor, variedad, folio u OT.</p>
                <Button variant="secondary" className="mt-4" onClick={() => setSearchTerm('')}>Limpiar búsqueda</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-cku-black">Resultados de la búsqueda ({searchResults.total})</h2>
                <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <XCircleIcon className="w-4 h-4 mr-2" />
                    Limpiar Filtros
                </Button>
            </div>

            {/* SECCIÓN: PLANTILLAS (INICIO) */}
            {searchResults.templates.length > 0 && (
                <section>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                        <PlusCircleIcon className="w-4 h-4 mr-2" />
                        Disponibles en Inicio (Nueva Planilla)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {searchResults.templates.map(t => (
                            <Card key={t.id} className="hover:border-cku-blue cursor-pointer transition-colors" onClick={() => navigate(`/forms/new?templateId=${t.id}`, { state: { fromNew: true } })}>
                                <CardContent className="p-4 flex items-start space-x-3">
                                    <FileTextIcon className="w-6 h-6 text-cku-blue flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="font-bold text-gray-900">{t.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                                        <Badge status={t.status === 'Publicada' ? 'Ingresado' : 'Borrador'} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* SECCIÓN: BORRADORES */}
            {searchResults.drafts.length > 0 && (
                <section>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                        <EditIcon className="w-4 h-4 mr-2" />
                        Encontrado en Borradores
                    </h3>
                    <div className="bg-white rounded-xl border border-gray-200 divide-y">
                        {searchResults.drafts.map(d => {
                             const t = templates.find(tmp => tmp.id === d.templateId);
                             return (
                                <div key={d.id} className="p-4 hover:bg-gray-50 flex justify-between items-center cursor-pointer" onClick={() => navigate(`/forms/fill/${d.id}`)}>
                                    <div>
                                        <p className="font-semibold text-cku-blue">{d.customName || t?.title || 'Formulario Desconocido'}</p>
                                        <p className="text-sm text-gray-600">
                                            {d.data.productor || d.data.identificacion?.productor || 'Sin Productor'} 
                                            <span className="mx-2 text-gray-300">|</span> 
                                            {d.planta}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">Modificado: {new Date(d.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                    <Badge status="Borrador" />
                                </div>
                             )
                        })}
                    </div>
                </section>
            )}

            {/* SECCIÓN: BIBLIOTECA / REGISTROS */}
            {searchResults.records.length > 0 && (
                <section>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                        <FolderIcon className="w-4 h-4 mr-2" />
                        {role === 'Administrador' ? 'Encontrado en Biblioteca de Registros (Admin)' : 'Encontrado en Mi Biblioteca'}
                    </h3>
                    <div className="bg-white rounded-xl border border-gray-200 divide-y">
                        {searchResults.records.map(r => {
                             const t = templates.find(tmp => tmp.id === r.templateId);
                             const targetPath = role === 'Administrador' ? `/records/${r.id}` : `/forms/fill/${r.id}`; // CKU ve read-only en fill
                             return (
                                <div key={r.id} className="p-4 hover:bg-gray-50 flex justify-between items-center cursor-pointer" onClick={() => navigate(targetPath)}>
                                    <div>
                                        <p className="font-semibold text-gray-900">{r.customName || t?.title || 'Formulario Desconocido'}</p>
                                        <p className="text-sm text-gray-600">
                                            {r.data.productor || r.data.identificacion?.productor || 'Sin Productor'}
                                            {r.data.encabezado?.folio_cku ? ` - Folio: ${r.data.encabezado.folio_cku}` : ''}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Ingresado por: {r.submittedBy} el {new Date(r.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Badge status="Ingresado" />
                                </div>
                             )
                        })}
                    </div>
                </section>
            )}
        </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Portal de Inicio"
        description="Bienvenido al sistema de Planillas CKU."
        breadcrumbs={[{ label: 'Inicio' }]}
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder={role === 'Administrador' ? "Buscar en todo el sistema (Productor, OT, Folio...)" : "Buscar en mis registros y plantillas..."}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {role === 'Administrador' && (
          <Button onClick={() => navigate('/admin')}>
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Gestionar Plantillas
          </Button>
        )}
      </div>

      {searchTerm ? (
          renderSearchResults()
      ) : (
          <>
            <section>
            <h2 className="text-2xl font-bold text-cku-black mb-4">
                Plantillas Disponibles
            </h2>
            {publishedTemplates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {publishedTemplates.map((template) => (
                    <Card
                    key={template.id}
                    className={`flex flex-col hover:shadow-lg transition-shadow ${template.status === 'Deprecada' ? 'opacity-75 grayscale' : ''}`}
                    >
                    <CardHeader>
                        <div className="flex items-start justify-between">
                        <FileTextIcon className={`w-8 h-8 ${template.status === 'Publicada' ? 'text-cku-blue' : 'text-gray-400'}`} />
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded">
                                v{template.version}
                            </span>
                            {role === 'Administrador' && (
                                <span className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                    template.status === 'Publicada' ? 'bg-green-100 text-green-700' : 
                                    template.status === 'Deprecada' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                    {template.status}
                                </span>
                            )}
                        </div>
                        </div>
                        <CardTitle className="mt-4">{template.title}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-end">
                        <Button
                        disabled={template.status === 'Deprecada' && role !== 'Administrador'}
                        aria-label={`Crear nuevo registro de ${template.title}`}
                        onClick={() =>
                            navigate(`/forms/new?templateId=${template.id}`, {
                            state: { fromNew: true },
                            })
                        }
                        >
                        {template.status === 'Deprecada' ? 'Obsoleto' : 'Crear Nuevo Registro'}
                        </Button>
                    </CardContent>
                    </Card>
                ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-2xl border">
                <p className="text-gray-600">
                    No hay plantillas disponibles para tu rol.
                </p>
                </div>
            )}
            </section>

            <div className="grid grid-cols-1">
                <Card>
                <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                    <CardDescription>
                    {role === 'Trabajador CKU'
                        ? 'Tus últimos registros ingresados.'
                        : 'Últimos registros ingresados en el sistema.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {recentActivity.length > 0 ? (
                    <ul className="space-y-4">
                        {recentActivity.map((activity) => {
                        const template = templates.find(
                            (t) => t.id === activity.templateId
                        );
                        const activityDetails = [
                            new Date(activity.updatedAt).toLocaleDateString('es-CL'),
                            activity.planta,
                            activity.submittedBy,
                        ].filter(Boolean).join(' | ');

                        return (
                            <li
                            key={activity.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                            <div className="flex items-center space-x-3">
                                <ClockIcon className="w-5 h-5 text-gray-400" />
                                <div>
                                <p className="font-semibold">{activity.customName || template?.title}</p>
                                <p className="text-sm text-gray-500">
                                    {activityDetails}
                                </p>
                                </div>
                            </div>
                            <Badge status={activity.status} />
                            </li>
                        );
                        })}
                    </ul>
                    ) : (
                    <p className="text-gray-500 text-center py-8">
                        No hay actividad reciente.
                    </p>
                    )}
                </CardContent>
                </Card>
            </div>
          </>
      )}
    </div>
  );
};

export default Home;