import apiClient from './client';

/**
 * API endpoints para generación de reactivos
 */

/**
 * Solicita la generación de nuevos reactivos basados en documentos y parámetros
 * @param {Object} data - Datos del formulario (program, subject, topic, difficulty, document_ids, etc.)
 * @returns {Promise} Configuración y preguntas generadas
 */
export const generateQuestions = async (data) => {
    const response = await apiClient.post('/api/questions/generate', data);
    return response.data;
};

/**
 * Obtiene una previsualización del prompt
 * @param {Object} data 
 */
export const previewPrompt = async (data) => {
    const response = await apiClient.post('/api/questions/preview-prompt', data);
    return response.data;
};

/**
 * Regenera una pregunta específica
 * @param {number} questionId 
 */
export const regenerateQuestion = async (questionId, modelName = null) => {
    let url = `/api/questions/${questionId}/regenerate`;
    if (modelName) {
        url += `?model_name=${encodeURIComponent(modelName)}`;
    }
    const response = await apiClient.post(url);
    return response.data;
};

export const updateBank = async (updates) => {
    const response = await apiClient.put('/api/questions/batch-update', updates);
    return response.data;
};

export const getBankQuestions = async (configId) => {
    const response = await apiClient.get(`/api/questions/bank/${configId}`);
    return response.data;
};

export const addManualQuestion = async (configId, data) => {
    const response = await apiClient.post(`/api/questions/bank/${configId}/add`, data);
    return response.data;
};

export const checkGenerationStatus = async (configId) => {
    const response = await apiClient.get(`/api/questions/status/${configId}`);
    return response.data;
};
