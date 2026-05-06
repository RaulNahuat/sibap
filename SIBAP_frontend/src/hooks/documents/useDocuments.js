import { useState, useEffect, useCallback } from 'react';
import { uploadDocument, getDocuments, deleteDocument, uploadFromDrive } from '../../api/documents';
import { getErrorMessage } from '../../utils/errorHandler';

export const useDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Paginación
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);
    const limit = 10;

    // Filtros y Ordenamiento
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('recent');

    // Selección
    const [selectedDocs, setSelectedDocs] = useState([]);

    const loadDocuments = useCallback(async (isBackground = false) => {
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
    }, [page]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

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
    }, [documents, loadDocuments]);

    const handleUpload = async (file, isComplex) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await uploadDocument(file, isComplex);
            setSuccess(`Documento "${result.filename}" subido. Procesamiento iniciado en segundo plano.`);
            await loadDocuments();
            return true;
        } catch (err) {
            setError(getErrorMessage(err));
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleDriveImport = async (driveUrl, driveIsComplex, setIsDriveLoading) => {
        if (!driveUrl.trim()) return false;
        setIsDriveLoading(true);
        setError('');
        setSuccess('');
        try {
            const result = await uploadFromDrive(driveUrl.trim(), driveIsComplex);
            setSuccess(`Archivo de Drive "${result.filename}" importado. Procesamiento iniciado en segundo plano.`);
            await loadDocuments();
            return true;
        } catch (err) {
            setError(getErrorMessage(err));
            return false;
        } finally {
            setIsDriveLoading(false);
        }
    };

    const deleteDoc = async (id) => {
        try {
            await deleteDocument(id);
            setSuccess('Documento eliminado exitosamente');
            await loadDocuments();
            return true;
        } catch (err) {
            setError(getErrorMessage(err));
            return false;
        }
    };

    const bulkDeleteDocs = async (ids) => {
        try {
            await Promise.all(ids.map(id => deleteDocument(id)));
            setSuccess(`${ids.length} documento(s) eliminado(s)`);
            setSelectedDocs([]);
            await loadDocuments();
            return true;
        } catch (err) {
            setError('Error al eliminar documentos');
            return false;
        }
    };

    const toggleSelectDoc = (id) => {
        setSelectedDocs(prev =>
            prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
        );
    };

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

    const toggleSelectAll = () => {
        if (selectedDocs.length === filteredDocuments.length) {
            setSelectedDocs([]);
        } else {
            setSelectedDocs(filteredDocuments.map(doc => doc.id));
        }
    };

    return {
        documents,
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
    };
};
