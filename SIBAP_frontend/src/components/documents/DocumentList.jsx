import { FileText, AlignLeft, Eye, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const DocumentList = ({
    documents,
    selectedDocs,
    toggleSelectDoc,
    toggleSelectAll,
    handleViewDocument,
    handleDelete,
    searchTerm
}) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
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

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col max-h-[60vh] sm:max-h-[70vh]">
            {/* Header de tabla - Oculto en móvil */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-gray-200 shrink-0">
                <div className="col-span-1 flex items-center">
                    <input
                        type="checkbox"
                        checked={selectedDocs.length === documents.length && documents.length > 0}
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
                {documents.length === 0 ? (
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
                    documents.map((doc) => (
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
    );
};

export default DocumentList;
