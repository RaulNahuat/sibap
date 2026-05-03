import apiClient from './client';

/**
 * API endpoints para gestión de documentos
 */


export const uploadDocument = async (file, isComplex = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_complex', isComplex);

    const response = await apiClient.post('/api/documents/extract-text', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};


export const getDocuments = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const response = await apiClient.get(`/api/documents?skip=${skip}&limit=${limit}`);
    return response.data;
};


export const getDocument = async (id) => {
    const response = await apiClient.get(`/api/documents/${id}`);
    return response.data;
};


export const deleteDocument = async (id) => {
    const response = await apiClient.delete(`/api/documents/${id}`);
    return response.data;
};


export const uploadFromDrive = async (driveUrl, isComplex = false) => {
    const response = await apiClient.post('/api/documents/from-drive', {
        drive_url: driveUrl,
        is_complex: isComplex
    });
    return response.data;
};

