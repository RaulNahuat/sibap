import client from './client';

export const getAIModels = async () => {
    try {
        const response = await client.get('/config/ai-models');
        return response.data;
    } catch (error) {
        console.error('Error al obtener los modelos de IA:', error);
        throw error;
    }
};
