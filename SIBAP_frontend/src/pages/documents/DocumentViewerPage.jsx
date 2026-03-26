import { useState, useEffect, useRef, Children } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import {
    FileText,
    ChevronLeft,
    Download,
    Copy,
    Sparkles,
    AlertTriangle,
    Calendar
} from 'lucide-react';
import { getDocument, downloadOriginalDocument } from '../../api/documents';
import { getErrorMessage } from '../../utils/errorHandler';

const ITEMS_PER_PAGE = 3000;

const DocumentViewerPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [extractedText, setExtractedText] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    const contentTopRef = useRef(null);

    useEffect(() => {
        const fetchDocument = async () => {
            setLoading(true);
            try {
                const doc = await getDocument(id);
                setDocument(doc);
                const text = doc.content_text || 'El documento no contiene texto extraíble.';
                setExtractedText(text);
            } catch (err) {
                console.error('Error al obtener documento:', err);
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDocument();
        }
    }, [id]);



    const handleDownloadOriginal = async () => {
        setIsDownloading(true);
        try {
            const blob = await downloadOriginalDocument(document.id);
            const url = URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = document.filename || 'documento_original';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error al descargar original:', err);
            setError('Error al descargar documento físico original. Podría haber sido eliminado.');
        } finally {
            setIsDownloading(false);
        }
    };

    const isOcrWarning = (text) => {
        return text && text.includes("[Aviso: Este PDF parece ser una imagen");
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f4f7f6]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a5276]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f7f6] p-4">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-[#0b2540] mb-2">Error al cargar documento</h2>
                    <p className="text-red-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/dashboard/documents')}
                        className="px-4 py-2 bg-[#1a5276] text-white rounded-md hover:bg-[#145a86] transition-colors"
                    >
                        Volver a mis documentos
                    </button>
                </div>
            </div>
        );
    }

    if (!document) return null;

    return (
        <div className="min-h-screen bg-[#f4f7f6] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-[#00000014] sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 sm:h-16 gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard/documents')}
                                className="p-2 text-[#7b8a8a] hover:text-[#1a5276] hover:bg-gray-100 rounded-full transition-colors"
                                title="Volver"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${getFileTypeBadge(document.file_type)} bg-opacity-20`}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-[#0b2540] truncate max-w-md">
                                        {document.filename}
                                    </h1>
                                    <div className="flex items-center gap-3 text-xs text-[#7b8a8a]">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(document.uploaded_at)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            {document.characters?.toLocaleString()} caracteres
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                            {document.has_physical_file && (
                                <button
                                    onClick={handleDownloadOriginal}
                                    disabled={isDownloading}
                                    className="flex items-center gap-1.5 px-3 py-2 text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors text-sm font-medium mr-2 disabled:opacity-50"
                                >
                                    {isDownloading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline">
                                        {isDownloading ? 'Descargando...' : 'Descargar Original'}
                                    </span>
                                </button>
                            )}
                            <button
                                className="flex items-center gap-1.5 px-3 py-2 text-[#7b8a8a] hover:text-[#0b2540] hover:bg-gray-50 rounded-md transition-colors text-sm font-medium"
                                title="Copiar texto"
                                onClick={() => {
                                    navigator.clipboard.writeText(extractedText);
                                }}
                            >
                                <Copy className="w-4 h-4" />
                                <span className="hidden sm:inline">Copiar</span>
                            </button>
                            <button
                                className="flex items-center gap-1.5 px-3 py-2 text-[#7b8a8a] hover:text-[#0b2540] hover:bg-gray-50 rounded-md transition-colors text-sm font-medium"
                                title="Descargar Markdown"
                                onClick={() => {
                                    const blob = new Blob([extractedText], { type: 'text/markdown' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${document.filename}.md`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Descargar MD</span>
                            </button>
                            <div className="h-6 w-px bg-gray-200 mx-1"></div>
                            <button
                                onClick={() => navigate('/dashboard/new-bank', { state: { selectedDocuments: [document.id] } })}
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#1a5276] text-white rounded-md hover:bg-[#145a86] transition-colors font-medium text-sm shadow-sm whitespace-nowrap"
                            >
                                <Sparkles className="w-4 h-4" />
                                Usar con IA
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 md:p-8">
                {/* Anchor for scrolling */}
                <div ref={contentTopRef} className="scroll-mt-24" />

                <div className="bg-white rounded-xl shadow-sm border border-[#00000014] min-h-[calc(100vh-140px)] flex flex-col">
                    {isOcrWarning(extractedText) ? (
                        <div className="p-12 flex flex-col items-center justify-center text-center h-full">
                            <div className="bg-yellow-100 p-4 rounded-full mb-6">
                                <AlertTriangle className="w-10 h-10 text-yellow-600" />
                            </div>
                            <h3 className="text-xl font-bold text-[#0b2540] mb-3">
                                Documento escaneado o vacío
                            </h3>
                            <p className="text-[#7b8a8a] max-w-lg mb-8 text-lg">
                                Este documento parece ser una imagen escaneada o no contiene texto seleccionable.
                                Para procesarlo correctamente, necesitaríamos aplicar OCR (Reconocimiento Óptico de Caracteres).
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 sm:p-8 md:p-12 prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-[#0b2540] prose-p:text-[#334155] prose-li:text-[#334155] prose-strong:text-[#0b2540] prose-table:w-full prose-table:text-sm prose-thead:bg-slate-50 prose-th:p-3 prose-td:p-3 prose-th:text-left prose-td:border-b prose-td:border-slate-100 flex-1 overflow-x-auto">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: false }]]}
                                    rehypePlugins={[
                                        rehypeRaw,
                                        [rehypeKatex, { throwOnError: false, strict: false }],
                                    ]}
                                    components={{
                                        table: ({ node, children, ...props }) => (
                                            <table {...props}>{Children.toArray(children).filter(child => typeof child !== 'string' || child.trim().length > 0)}</table>
                                        ),
                                        tbody: ({ node, children, ...props }) => (
                                            <tbody {...props}>{Children.toArray(children).filter(child => typeof child !== 'string' || child.trim().length > 0)}</tbody>
                                        ),
                                        thead: ({ node, children, ...props }) => (
                                            <thead {...props}>{Children.toArray(children).filter(child => typeof child !== 'string' || child.trim().length > 0)}</thead>
                                        ),
                                        tr: ({ node, children, ...props }) => (
                                            <tr {...props}>{Children.toArray(children).filter(child => typeof child !== 'string' || child.trim().length > 0)}</tr>
                                        ),
                                        colgroup: ({ node, children, ...props }) => (
                                            <colgroup {...props}>{Children.toArray(children).filter(child => typeof child !== 'string' || child.trim().length > 0)}</colgroup>
                                        ),
                                    }}
                                >
                                    {extractedText}
                                </ReactMarkdown>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentViewerPage;
