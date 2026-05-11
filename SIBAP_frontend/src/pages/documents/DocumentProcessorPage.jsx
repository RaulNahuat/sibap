import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload,
    Search,
    ChevronDown,
    Sparkles,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Trash2,
    CheckCircle
} from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useDocuments } from '../../hooks/documents/useDocuments';
import DocumentUploadModal from '../../components/documents/DocumentUploadModal';
import DocumentList from '../../components/documents/DocumentList';
import PageHeader from '../../components/ui/PageHeader';

const DocumentProcessorPage = () => {
    const navigate = useNavigate();
    const {
        filteredDocuments,
        loading,
        error,
        success,
        setError,
        setSuccess,
        page,
        setPage,
        totalPages,
        totalDocs,
        searchTerm,
        setSearchTerm,
        filterType,
        setFilterType,
        sortBy,
        setSortBy,
        selectedDocs,
        setSelectedDocs,
        toggleSelectDoc,
        toggleSelectAll,
        loadDocuments,
        handleUpload,
        handleDriveImport,
        deleteDoc,
        bulkDeleteDocs
    } = useDocuments();

    // Estados de la UI
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isConfirmBulkDeleteOpen, setIsConfirmBulkDeleteOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState(null);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handleViewDocument = (doc) => {
        navigate(`/dashboard/documents/${doc.id}`);
    };

    const handleDelete = (id) => {
        setDocToDelete(id);
        setIsConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!docToDelete) return;
        const success = await deleteDoc(docToDelete);
        if (success) {
            setDocToDelete(null);
            setIsConfirmDeleteOpen(false);
        }
    };

    const handleDeleteSelected = () => {
        if (selectedDocs.length === 0) return;
        setIsConfirmBulkDeleteOpen(true);
    };

    const confirmBulkDelete = async () => {
        const success = await bulkDeleteDocs(selectedDocs);
        if (success) {
            setIsConfirmBulkDeleteOpen(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-24">
            {/* Sección del header con el botón de subida */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <PageHeader 
                    title="Mis Documentos" 
                    description="Gestiona y procesa tus archivos para generar bancos de preguntas con inteligencia artificial." 
                    className="mb-10"
                />
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-[#1a5276] text-white rounded-xl hover:bg-[#154360] transition-all font-semibold shadow-md active:scale-95"
                >
                    <Upload className="w-5 h-5" />
                    Subir nuevo documento
                </button>
            </div>

            {/* Mensajes */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">✕</button>
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center justify-between">
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">✕</button>
                </div>
            )}

            {/* Filtros */}
            <div className="bg-white rounded-lg border border-[#00000014] p-5 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-[#0b2540]">Filtros rápidos</h3>
                        <button
                            onClick={() => loadDocuments()}
                            disabled={loading}
                            className={`p-1 text-[#7b8a8a] hover:text-[#1a5276] rounded-full hover:bg-gray-100 transition-all ${loading ? 'animate-spin' : ''}`}
                            title="Actualizar lista"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-[#7b8a8a]">
                        Total: {totalDocs} documento{totalDocs !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    {/* Búsqueda */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-[#7b8a8a] mb-1">
                            Buscar
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7b8a8a]" />
                            <input
                                type="text"
                                placeholder="Nombre del documento..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 border border-[#00000014] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Tipo de archivo */}
                    <div>
                        <label className="block text-xs font-medium text-[#7b8a8a] mb-1">
                            Tipo de archivo
                        </label>
                        <div className="relative">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full h-9 px-3 border border-[#00000014] rounded-md text-sm text-[#7b8a8a] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent appearance-none bg-white cursor-pointer"
                            >
                                <option value="all">Todos</option>
                                <option value="PDF">PDF</option>
                                <option value="DOCX">DOCX</option>
                                <option value="PPTX">PowerPoint (PPTX)</option>
                                <option value="TXT">TXT</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7b8a8a] pointer-events-none" />
                        </div>
                    </div>

                    {/* Ordenar */}
                    <div>
                        <label className="block text-xs font-medium text-[#7b8a8a] mb-1">
                            Ordenar por
                        </label>
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full h-9 px-3 border border-[#00000014] rounded-md text-sm text-[#7b8a8a] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent appearance-none bg-white cursor-pointer"
                            >
                                <option value="recent">Fecha reciente</option>
                                <option value="name">Nombre A-Z</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7b8a8a] pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Chips de filtro rápido */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${filterType === 'all'
                            ? 'border-[#1a5276] bg-[#1a5276] text-white'
                            : 'border-[#00000014] bg-[#f4f7f6] text-[#7b8a8a] hover:bg-[#e6eceb]'
                            }`}
                    >
                        Todos
                    </button>
                </div>
            </div>

            {/* Componente de lista de documentos */}
            <DocumentList
                documents={filteredDocuments}
                selectedDocs={selectedDocs}
                toggleSelectDoc={toggleSelectDoc}
                toggleSelectAll={toggleSelectAll}
                handleViewDocument={handleViewDocument}
                handleDelete={handleDelete}
                searchTerm={searchTerm}
            />

            {/* Área de interacción (Paginación + Acciones) - Flujo Normal */}
            <div className="mt-8 flex flex-col gap-6">
                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="px-6 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-between transition-all">
                        <div className="text-xs font-bold text-[#1a5276]">
                            Página {page} de {totalPages}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1 || loading}
                                className="p-1.5 rounded-lg border border-gray-200 text-[#1a5276] hover:bg-[#eaf3f7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages || loading}
                                className="p-1.5 rounded-lg border border-gray-200 text-[#1a5276] hover:bg-[#eaf3f7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Acciones masivas */}
                {selectedDocs.length > 0 && (
                    <div className="mt-4 bg-[#1a5276] text-white p-2.5 sm:p-3 rounded-xl shadow-md flex items-center justify-between gap-2 border border-blue-900/30 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 pl-1">
                            <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                                <CheckCircle className="w-3.5 h-3.5 text-blue-200" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold">{selectedDocs.length} <span className="hidden sm:inline">seleccionado{selectedDocs.length !== 1 ? 's' : ''}</span></span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Borrar</span>
                            </button>
                            <button
                                onClick={() => navigate('/dashboard/new-bank', { state: { selectedDocuments: selectedDocs } })}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#1a5276] hover:bg-blue-50 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Generar Reactivos
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de carga */}
            {showUploadModal && (
                <DocumentUploadModal
                    onClose={() => setShowUploadModal(false)}
                    onUpload={handleUpload}
                    onDriveImport={handleDriveImport}
                />
            )}

            {/* Modales de Confirmación */}
            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={confirmDelete}
                title="Eliminar documento"
                message="¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                danger={true}
            />

            <ConfirmModal
                isOpen={isConfirmBulkDeleteOpen}
                onClose={() => setIsConfirmBulkDeleteOpen(false)}
                onConfirm={confirmBulkDelete}
                title="Eliminar documentos"
                message={`¿Estás seguro de que deseas eliminar los ${selectedDocs.length} documentos seleccionados?`}
                confirmText="Eliminar todos"
                danger={true}
            />

        </div>
    );
};

export default DocumentProcessorPage;
