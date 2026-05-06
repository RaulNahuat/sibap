import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Trash2,
    Upload,
    Search,
    ChevronDown,
    Sparkles,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    X,
    Eye,
    Link,
    AlignLeft
} from 'lucide-react';
import FileUploader from '../../components/documents/FileUploader';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { uploadDocument, getDocuments, deleteDocument, uploadFromDrive } from '../../api/documents';
import { getErrorMessage } from '../../utils/errorHandler';

const DocumentProcessorPage = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [selectedDocs, setSelectedDocs] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadMode, setUploadMode] = useState('local');
    const [driveUrl, setDriveUrl] = useState('');
    const [driveIsComplex, setDriveIsComplex] = useState(false);
    const [isDriveLoading, setIsDriveLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isConfirmBulkDeleteOpen, setIsConfirmBulkDeleteOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState(null);
    const limit = 10;

    useEffect(() => {
        loadDocuments();
    }, [page]);

    useEffect(() => {
        const hasPendingDocs = documents.some(doc =>
            doc.status === 'PROCESSING' || doc.status === 'PENDING'
        );

        if (hasPendingDocs) {
            const intervalId = setInterval(() => {
                loadDocuments(true);
            }, 5000);

            return () => clearInterval(intervalId);
        }
    }, [documents]);

    const loadDocuments = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const response = await getDocuments(page, limit);
            setDocuments(response.items || []);
            setTotalPages(response.pages || 1);
            setTotalDocs(response.total || 0);
        } catch (err) {
            console.error('Error cargando documentos:', err);
            setError('Error al cargar la lista de documentos.');
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handleViewDocument = (doc) => {
        navigate(`/dashboard/documents/${doc.id}`);
    };

    const handleUpload = async (file, isComplex) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await uploadDocument(file, isComplex);
            setSuccess(`Documento "${result.filename}" subido. Procesamiento iniciado en segundo plano.`);
            setShowUploadModal(false);
            await loadDocuments();
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDriveImport = async () => {
        if (!driveUrl.trim()) return;
        setIsDriveLoading(true);
        setError('');
        setSuccess('');
        try {
            const result = await uploadFromDrive(driveUrl.trim(), driveIsComplex);
            setSuccess(`Archivo de Drive "${result.filename}" importado. Procesamiento iniciado en segundo plano.`);
            setShowUploadModal(false);
            setDriveUrl('');
            setDriveIsComplex(false);
            await loadDocuments();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsDriveLoading(false);
        }
    };

    const handleDelete = (id) => {
        setDocToDelete(id);
        setIsConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!docToDelete) return;

        try {
            await deleteDocument(docToDelete);
            setSuccess('Documento eliminado exitosamente');
            await loadDocuments();
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
        } finally {
            setDocToDelete(null);
        }
    };

    const handleDeleteSelected = () => {
        if (selectedDocs.length === 0) return;
        setIsConfirmBulkDeleteOpen(true);
    };

    const confirmBulkDelete = async () => {
        try {
            await Promise.all(selectedDocs.map(id => deleteDocument(id)));
            setSuccess(`${selectedDocs.length} documento(s) eliminado(s)`);
            setSelectedDocs([]);
            await loadDocuments();
        } catch (err) {
            setError('Error al eliminar documentos');
        }
    };

    const toggleSelectDoc = (id) => {
        setSelectedDocs(prev =>
            prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedDocs.length === filteredDocuments.length) {
            setSelectedDocs([]);
        } else {
            setSelectedDocs(filteredDocuments.map(doc => doc.id));
        }
    };

    // Filtar y ordenar los documentos de forma robusta
    const filteredDocuments = (documents || [])
        .filter(doc => {
            if (!searchTerm) return true;
            return doc.filename.toLowerCase().includes(searchTerm.toLowerCase().trim());
        })
        .filter(doc => {
            if (filterType === 'all') return true;
            return doc.file_type && doc.file_type.toUpperCase() === filterType.toUpperCase();
        })
        .sort((a, b) => {
            if (sortBy === 'recent') {
                return new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0);
            }
            return (a.filename || "").localeCompare(b.filename || "");
        });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const kb = bytes / 1024;
        const mb = kb / 1024;
        if (mb >= 1) return `${mb.toFixed(1)} MB`;
        return `${kb.toFixed(0)} KB`;
    };

    const getFileTypeBadge = (type) => {
        const colors = {
            'PDF': 'bg-red-100 text-red-700',
            'DOCX': 'bg-blue-100 text-blue-700',
            'PPTX': 'bg-orange-100 text-orange-700',
            'TXT': 'bg-green-100 text-green-700'
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };

    const getStatusBadge = (status, errorMsg) => {
        switch (status) {
            case 'COMPLETED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" /> Completado
                    </span>
                );
            case 'PROCESSING':
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Procesando
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700" title={errorMsg}>
                        <AlertCircle className="w-3 h-3" /> Error
                    </span>
                );
            default:
                return null;
        }
    };

    const isOcrWarning = (text) => {
        return text && text.includes("[Aviso: Este PDF parece ser una imagen");
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24">
            {/* Sección del header con el botón de subida */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#1a5276] tracking-tight mb-2">
                        Mis Documentos
                    </h1>
                    <p className="text-[#64748b] text-[15px] max-w-lg">
                        Gestiona y procesa tus archivos para generar bancos de preguntas con inteligencia artificial.
                    </p>
                </div>
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
                            onClick={loadDocuments}
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

            {/* Tabla de documentos con scroll interno */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col max-h-[60vh] sm:max-h-[70vh]">
                {/* Header de tabla - Oculto en móvil */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-gray-200 shrink-0">
                    <div className="col-span-1 flex items-center">
                        <input
                            type="checkbox"
                            checked={selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-[#00000014] text-[#1a5276] focus:ring-[#1a5276]"
                        />
                    </div>
                    <div className="col-span-5 text-xs font-medium text-[#7b8a8a]">
                        Nombre del documento
                    </div>
                    <div className="col-span-2 text-xs font-medium text-[#7b8a8a]">
                        Tipo / Estado
                    </div>
                    <div className="col-span-2 text-xs font-medium text-[#7b8a8a]">
                        Fecha de carga
                    </div>
                    <div className="col-span-2 text-xs font-medium text-[#7b8a8a] text-right">
                        Acciones
                    </div>
                </div>

                {/* Filas de documentos - ÁREA DE SCROLL */}
                <div className="flex-1 overflow-y-auto min-h-[50px] scrollbar-thin scrollbar-thumb-slate-200">
                    {filteredDocuments.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="w-12 h-12 text-[#7b8a8a] mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium text-[#0b2540] mb-1">
                                {searchTerm ? 'No se encontraron documentos' : '¿Aún no tienes documentos cargados?'}
                            </p>
                            <p className="text-sm text-[#7b8a8a]">
                                {searchTerm
                                    ? 'Intenta con otros términos de búsqueda'
                                    : 'Sube un PDF, DOCX, PPTX o TXT de hasta 10 MB para comenzar'
                                }
                            </p>
                        </div>
                    ) : (
                        filteredDocuments.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 md:py-3 border-b border-gray-100 hover:bg-slate-50/50 transition-colors md:items-center group"
                            >
                                {/* Nombre y metadatos */}
                                <div className="col-span-6 flex items-start gap-4">
                                    <div className="mt-1 shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={selectedDocs.includes(doc.id)}
                                            onChange={() => toggleSelectDoc(doc.id)}
                                            className="w-5 h-5 rounded border-gray-300 text-[#1a5276] focus:ring-[#1a5276] transition-transform active:scale-90"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-[15px] font-bold text-[#0f172a] truncate mb-1" title={doc.filename}>
                                            {doc.filename}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <p className="text-xs text-[#64748b] flex items-center gap-1">
                                                <AlignLeft className="w-3 h-3" />
                                                {doc.characters?.toLocaleString()} caracteres
                                            </p>
                                            <p className="text-xs text-[#64748b]">
                                                • {formatDate(doc.uploaded_at)}
                                            </p>

                                        </div>
                                    </div>
                                </div>

                                {/* Estado */}
                                <div className="col-span-3 flex flex-row md:flex-col items-center md:items-start gap-2 ml-9 md:ml-0">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getFileTypeBadge(doc.file_type)}`}>
                                        {doc.file_type}
                                    </span>
                                    {getStatusBadge(doc.status, doc.error_message)}
                                </div>

                                {/* Acciones - Botones siempre visibles y claros */}
                                <div className="col-span-3 flex items-center justify-end gap-2 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-gray-100 w-full md:w-auto">
                                    <button
                                        onClick={() => handleViewDocument(doc)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 text-[#1a5276] rounded-lg hover:bg-[#1a5276] hover:text-white transition-all text-xs font-bold border border-slate-200"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Ver
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all text-xs font-bold border border-red-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Borrar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

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

                {/* Acciones masivas - Fila única ultra compacta */}
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

            {/* Modal de upload (Fondo fijo) */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 transform transition-all scale-100">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-[#0b2540]">
                                Agregar documento
                            </h2>
                            <button
                                onClick={() => { setShowUploadModal(false); setDriveUrl(''); setUploadMode('local'); }}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6">
                            <button
                                onClick={() => setUploadMode('local')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                                    uploadMode === 'local'
                                        ? 'bg-white text-[#1a5276] shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Upload className="w-4 h-4" />
                                Subir archivo
                            </button>
                            <button
                                onClick={() => setUploadMode('drive')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                                    uploadMode === 'drive'
                                        ? 'bg-white text-[#1a5276] shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Link className="w-4 h-4" />
                                Desde Google Drive
                            </button>
                        </div>

                        {/* Contenido del tab activo */}
                        {uploadMode === 'local' ? (
                            <FileUploader
                                onUpload={handleUpload}
                                acceptedFormats={['.pdf', '.docx', '.pptx', '.txt']}
                                maxSizeMB={10}
                            />
                        ) : (
                            <div>
                                {/* Instrucción */}
                                <p className="text-sm text-gray-500 mb-4">
                                    Pega el enlace público de Google Drive. El archivo debe estar
                                    configurado como <strong>«Cualquiera con el enlace»</strong>.
                                    Máximo <strong>10 MB</strong>. Soporta formatos PDF, DOCX, TXT y PPTX.
                                </p>

                                {/* Input URL */}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="url"
                                            value={driveUrl}
                                            onChange={(e) => setDriveUrl(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleDriveImport()}
                                            placeholder="https://drive.google.com/file/d/..."
                                            className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                                        />
                                    </div>
                                    <button
                                        onClick={handleDriveImport}
                                        disabled={!driveUrl.trim() || isDriveLoading}
                                        className="px-4 py-2 bg-[#1a5276] text-white rounded-lg text-sm font-medium hover:bg-[#145a86] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {isDriveLoading ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Importando...
                                            </>
                                        ) : (
                                            'Importar'
                                        )}
                                    </button>
                                </div>

                                {/* Consejos */}
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                    <p className="text-xs font-semibold text-blue-700 mb-1">¿Cómo compartir el archivo?</p>
                                    <ol className="text-xs text-blue-600 space-y-0.5 list-decimal list-inside">
                                        <li>Abre el archivo en Google Drive</li>
                                        <li>Clic en <strong>Compartir</strong> → <strong>Cambiar acceso general</strong></li>
                                        <li>Selecciona <strong>«Cualquiera con el enlace»</strong></li>
                                        <li>Copia el enlace y pégalo aquí</li>
                                    </ol>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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
