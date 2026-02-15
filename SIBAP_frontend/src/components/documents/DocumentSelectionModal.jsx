import { useState, useEffect } from 'react';
import {
    X,
    Search,
    FileText,
    Check,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Upload
} from 'lucide-react';
import { getDocuments, uploadDocument } from '../../api/documents';

const DocumentSelectionModal = ({ isOpen, onClose, onSelect, selectedIds = [] }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [localSelectedIds, setLocalSelectedIds] = useState(selectedIds);
    const limit = 6;

    useEffect(() => {
        if (isOpen) {
            loadDocuments();
            setLocalSelectedIds(selectedIds);
        }
    }, [isOpen, page]);

    const loadDocuments = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getDocuments(page, limit);
            setDocuments(data.items || []);
            setTotalPages(data.pages || 1);
        } catch (err) {
            setError('Error al cargar documentos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError('');
        try {
            const result = await uploadDocument(file);
            // After upload, refresh list and select the new doc
            await loadDocuments();
            setLocalSelectedIds(prev => [...prev, result.id]);
        } catch (err) {
            setError('Error al subir documento');
        } finally {
            setIsUploading(false);
        }
    };

    const toggleSelect = (doc) => {
        setLocalSelectedIds(prev =>
            prev.includes(doc.id)
                ? prev.filter(id => id !== doc.id)
                : [...prev, doc.id]
        );
    };

    const handleConfirm = () => {
        onSelect(localSelectedIds);
        onClose();
    };

    if (!isOpen) return null;

    const filteredDocs = documents.filter(doc =>
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#e2e8f0]">
                    <div>
                        <h2 className="text-xl font-bold text-[#102129]">
                            Seleccionar de Mis Documentos
                        </h2>
                        <p className="text-sm text-[#64748b]">
                            Selecciona los archivos que deseas usar como base para el banco.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search and Upload */}
                <div className="p-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                        <input
                            type="text"
                            placeholder="Buscar documentos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                        />
                    </div>
                    <div>
                        <input
                            type="file"
                            id="modal-file-upload"
                            className="hidden"
                            onChange={handleUpload}
                            accept=".pdf,.docx,.txt"
                        />
                        <label
                            htmlFor="modal-file-upload"
                            className="flex items-center gap-2 px-4 py-2 bg-[#1a5276] text-white rounded-lg text-sm font-medium hover:bg-[#154360] transition-all cursor-pointer shadow-sm"
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">Subir Nuevo</span>
                        </label>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
                    {(loading && documents.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-full py-12">
                            <Loader2 className="w-8 h-8 text-[#1a5276] animate-spin mb-2" />
                            <p className="text-sm text-[#64748b]">Cargando documentos...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-red-500">
                            <AlertCircle className="w-8 h-8 mb-2" />
                            <p className="text-sm">{error}</p>
                            <button
                                onClick={loadDocuments}
                                className="mt-4 text-sm font-medium text-[#1a5276] hover:underline"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : (filteredDocs.length === 0 && !loading) ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-[#64748b]">
                            <FileText className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm">No se encontraron documentos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredDocs.map((doc) => {
                                const isSelected = localSelectedIds.includes(doc.id);
                                return (
                                    <button
                                        key={doc.id}
                                        onClick={() => toggleSelect(doc)}
                                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${isSelected
                                                ? 'border-[#1a5276] bg-[#e9f5f8] ring-1 ring-[#1a5276]'
                                                : 'border-[#e2e8f0] hover:border-[#cbd5e1] bg-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <div className={`p-2 rounded-md ${isSelected ? 'bg-white text-[#1a5276]' : 'bg-[#f1f5f9] text-[#64748b]'
                                                }`}>
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${isSelected ? 'text-[#1a5276]' : 'text-[#102129]'}`}>
                                                    {doc.filename}
                                                </p>
                                                <p className="text-xs text-[#64748b]">
                                                    {new Date(doc.uploaded_at).toLocaleDateString()} · {doc.file_type}
                                                </p>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-[#1a5276] flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc] rounded-b-xl">
                    <div className="flex items-center gap-2">
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1 rounded hover:bg-white border border-transparent hover:border-[#cbd5e1] disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs text-[#64748b] px-2">
                                    Pág {page} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-1 rounded hover:bg-white border border-transparent hover:border-[#cbd5e1] disabled:opacity-30"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-[#64748b]">
                            {localSelectedIds.length} seleccionados
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#102129]"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={localSelectedIds.length === 0}
                            className="bg-[#1a5276] text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-[#154360] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            Confirmar Selección
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentSelectionModal;
