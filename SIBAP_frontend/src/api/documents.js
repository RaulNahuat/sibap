import apiClient from './client';

/**
 * API endpoints para gestión de documentos
 */

/**
 * Sube un archivo y extrae su texto
 * @param {File} file - Archivo a subir (PDF, DOCX, TXT)
 * @returns {Promise} Documento guardado con texto extraído
 */
export const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/documents/extract-text', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

/**
 * Obtiene la lista de documentos del usuario
 * @returns {Promise} Array de documentos
 */
export const getDocuments = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const response = await apiClient.get(`/api/documents?skip=${skip}&limit=${limit}`);
    return response.data;
};

/**
 * Obtiene un documento específico por ID
 * @param {number} id - ID del documento
 * @returns {Promise} Documento completo con texto
 */
export const getDocument = async (id) => {
    const response = await apiClient.get(`/api/documents/${id}`);
    return response.data;
};

/**
 * Elimina un documento
 * @param {number} id - ID del documento a eliminar
 * @returns {Promise} Mensaje de confirmación
 */
export const deleteDocument = async (id) => {
    const response = await apiClient.delete(`/api/documents/${id}`);
    return response.data;
};
