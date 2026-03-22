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
    // 'local' | 'drive'
    const [uploadMode, setUploadMode] = useState('local');
    const [driveUrl, setDriveUrl] = useState('');
    const [driveIsComplex, setDriveIsComplex] = useState(false);
    const [isDriveLoading, setIsDriveLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);
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
            }, 5000); // Consultar cada 5 segundos

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

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este documento?')) return;

        try {
            await deleteDocument(id);
            setSuccess('Documento eliminado exitosamente');
            await loadDocuments();
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedDocs.length === 0) return;
        if (!confirm(`¿Eliminar ${selectedDocs.length} documento(s) seleccionado(s)?`)) return;

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

    // Filtrar y ordenar documentos
    const filteredDocuments = documents
        .filter(doc => {
            const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'all' || doc.file_type === filterType;
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            if (sortBy === 'recent') {
                return new Date(b.uploaded_at) - new Date(a.uploaded_at);
            }
            return a.filename.localeCompare(b.filename);
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

    const getStorageBadge = (doc) => {
        if (doc.status !== 'COMPLETED') return null;
        
        if (doc.has_physical_file) {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#1a5276] bg-[#eaf3f7] px-1.5 py-0.5 rounded border border-[#1a5276]/20" title="Archivo original complejo conservado (hasta 24h)">
                    <FileText className="w-3 h-3" /> Físico intacto
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="Almacén optimizado: el archivo físico expiró o era simple. Solo texto disponible.">
                    <AlignLeft className="w-3 h-3" /> Solo texto
                </span>
            );
        }
    };

    const isOcrWarning = (text) => {
        return text && text.includes("[Aviso: Este PDF parece ser una imagen");
    };

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a5276] mb-1">
                        Insumos cargados
                    </h1>
                    <p className="text-sm text-[#7b8a8a]">
                        Gestiona los archivos que usas para generar bancos de preguntas con IA
                    </p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1a5276] text-white rounded-md hover:bg-[#145a86] transition-colors font-medium text-sm shadow-sm"
                >
                    <Upload className="w-4 h-4" />
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

            {/* Tabla de documentos */}
            <div className="bg-white rounded-lg border border-[#00000014] overflow-hidden shadow-sm">
                {/* Header de tabla */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-[#e6eceb] border-b border-[#00000014]">
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
                        Tipo
                    </div>
                    <div className="col-span-2 text-xs font-medium text-[#7b8a8a]">
                        Fecha de carga
                    </div>
                    <div className="col-span-2 text-xs font-medium text-[#7b8a8a] text-right">
                        Acciones
                    </div>
                </div>

                {/* Filas de documentos */}
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
                            className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#00000014] hover:bg-[#f4f7f6] transition-colors items-center group"
                        >
                            {/* Checkbox */}
                            <div className="col-span-1">
                                <input
                                    type="checkbox"
                                    checked={selectedDocs.includes(doc.id)}
                                    onChange={() => toggleSelectDoc(doc.id)}
                                    className="w-4 h-4 rounded border-[#00000014] text-[#1a5276] focus:ring-[#1a5276]"
                                />
                            </div>

                            {/* Nombre */}
                            <div className="col-span-5">
                                <div className="flex flex-col gap-0.5 mt-2 mb-2">
                                    <p className="text-sm font-medium text-[#0b2540] truncate pr-4" title={doc.filename}>
                                        {doc.filename}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <p className="text-[11px] text-[#7b8a8a]">
                                            {doc.characters?.toLocaleString()} caracteres
                                        </p>
                                        {getStorageBadge(doc)}
                                    </div>
                                </div>
                            </div>

                            {/* Estado y Tipo */}
                            <div className="col-span-2 flex flex-col gap-1 items-start">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getFileTypeBadge(doc.file_type)}`}>
                                    {doc.file_type}
                                </span>
                                {getStatusBadge(doc.status, doc.error_message)}
                            </div>

                            {/* Fecha */}
                            <div className="col-span-2">
                                <p className="text-sm text-[#7b8a8a]">
                                    {formatDate(doc.uploaded_at)}
                                </p>
                            </div>

                            {/* Acciones */}
                            <div className="col-span-2 flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleViewDocument(doc)}
                                    className="p-1.5 text-gray-500 hover:text-[#1a5276] hover:bg-[#eaf3f7] rounded-md transition-colors"
                                    title="Visualizar contenido"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => alert('Funcionalidad de IA pendiente')}
                                    className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                                    title="Usar con IA"
                                >
                                    <Sparkles className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-[#00000014] pt-4">
                    <div className="text-xs text-[#7b8a8a]">
                        Mostrando página {page} de {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1 || loading}
                            className="p-1.5 rounded-md border border-[#00000014] text-[#7b8a8a] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages || loading}
                            className="p-1.5 rounded-md border border-[#00000014] text-[#7b8a8a] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Footer con acciones masivas */}
            {filteredDocuments.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-[#7b8a8a]">
                        {selectedDocs.length > 0 ? (
                            <span>{selectedDocs.length} seleccionado{selectedDocs.length !== 1 ? 's' : ''}</span>
                        ) : (
                            <span>0 seleccionados</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedDocs.length > 0 && (
                            <>
                                <button
                                    onClick={handleDeleteSelected}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#00000014] bg-white text-[#d64545] rounded-md hover:bg-[#fee] transition-colors text-sm"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Eliminar seleccionados
                                </button>
                                <button
                                    onClick={() => alert('Funcionalidad pendiente')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a5276] text-white rounded-md hover:bg-[#145a86] transition-colors text-sm font-medium"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Crear banco con seleccionados
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de upload (Fixed background) */}
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
                                    Máximo <strong>10 MB</strong>. Soporta PDF, Google Docs, Sheets y Slides.
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

                                {/* Opciones adicionales */}
                                <div className="mt-4 flex items-start space-x-2 text-left">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="drive-complex-file"
                                            type="checkbox"
                                            checked={driveIsComplex}
                                            onChange={(e) => setDriveIsComplex(e.target.checked)}
                                            className="w-4 h-4 text-[#1a5276] bg-gray-100 border-gray-300 rounded focus:ring-[#1a5276] cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="drive-complex-file" className="text-sm font-medium text-gray-900 cursor-pointer">
                                            Es un documento complejo
                                        </label>
                                        <p className="text-xs text-gray-500">Mantiene el archivo original por 24h para OCR avanzado o si es muy pesado/difícil.</p>
                                    </div>
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


        </div>
    );
};

export default DocumentProcessorPage;
