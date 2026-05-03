import apiClient from './client';

// Endpoint para el manejo de la autenticación de usuarios

export const register = async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
};

export const login = async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
};

export const logout = async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
};

export const refreshToken = async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
};

export const requestPasswordReset = async (email) => {
    const response = await apiClient.post('/auth/password-reset/request', { email });
    return response.data;
};

export const verifyResetToken = async (token) => {
    const response = await apiClient.post('/auth/password-reset/verify', { token });
    return response.data;
};

export const completePasswordReset = async (token, newPassword) => {
    const response = await apiClient.post('/auth/password-reset/complete', {
        token,
        new_password: newPassword
    });
    return response.data;
};
