import apiClient from './client';

/**
 * Endpoints del API para usuarios
 */

export const getProfile = async () => {
    const response = await apiClient.get('/user/profile');
    return response.data;
};


export const updateProfile = async (userData) => {
    const response = await apiClient.put('/user/profile', userData);
    return response.data;
};


export const updatePassword = async (passwordData) => {
    const response = await apiClient.put('/user/password', passwordData);
    return response.data;
};


export const requestAccountDeletion = async (passwordData) => {
    const response = await apiClient.delete('/user/account', {
        data: passwordData
    });
    return response.data;
};
