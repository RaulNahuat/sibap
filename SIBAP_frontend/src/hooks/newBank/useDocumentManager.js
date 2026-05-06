import { useState } from 'react';
import { uploadDocument, getDocument } from '../../api/documents';
import { getErrorMessage } from '../../utils/errorHandler';
import { useLocalStorage } from '..';
import { useToast } from '../../context/ToastContext';

export const useDocumentManager = (user) => {
    const { showToast } = useToast();
    const filesKey = user?.id ? `sibap_newbank_files_${user.id}` : 'sibap_newbank_files';
    const [uploadedFiles, setUploadedFiles, clearUploadedFiles] = useLocalStorage(filesKey, []);

    const [isUploading, setIsUploading] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);

    //Manejo de subida de archivos 
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files || e.dataTransfer.files);
        if (files.length === 0) return;

        setIsUploading(true);

        try {
            const uploadPromises = files.map(file => uploadDocument(file));
            const results = await Promise.all(uploadPromises);

            setUploadedFiles(prev => {
                const existingIds = new Set(prev.map(f => f.id));
                const newFiles = results.filter(r => !existingIds.has(r.id));
                return [...prev, ...newFiles];
            });
        } catch (err) {
            const msg = getErrorMessage(err);
            showToast(msg, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleLibrarySelect = async (selectedIds) => {
        setIsUploading(true);
        try {
            const existingIds = new Set(uploadedFiles.map(f => f.id));
            const idsToFetch = selectedIds.filter(id => !existingIds.has(id));

            let fetchedDocs = [];
            if (idsToFetch.length > 0) {
                fetchedDocs = await Promise.all(idsToFetch.map(id => getDocument(id)));
            }

            setUploadedFiles(prev => {
                const filtered = prev.filter(f => selectedIds.includes(f.id));
                const combined = [...filtered, ...fetchedDocs];
                const seenIds = new Set();
                return combined.filter(doc => {
                    if (seenIds.has(doc.id)) return false;
                    seenIds.add(doc.id);
                    return true;
                });
            });
        } catch (err) {
            const msg = 'Error al cargar documentos seleccionados';
            showToast(msg, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = (id) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== id));
    };

    return {
        uploadedFiles,
        setUploadedFiles,
        clearUploadedFiles,
        isUploading,
        showLibraryModal,
        setShowLibraryModal,
        handleFileUpload,
        handleLibrarySelect,
        removeFile
    };
};
