import apiClient from './client';

/**
 * Endpoints del API para autenticación
 */

export const register = async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
};

/**
 * Login user
 * Retorna los datod del usuario y agrega el cookie httponly
 */
export const login = async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
};

/**
 * Logout user
 * Remueve el cookie httponly
 */
export const logout = async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
};

/**
 * Obtiene el perfil del usuario actual
 */
export const getCurrentUser = async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
};

/**
 * Renueva el access token usando el refresh token
 */
export const refreshToken = async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
};

/**
 * Solicita un reset de contraseña
 * Envía un email con el enlace de recuperación
 */
export const requestPasswordReset = async (email) => {
    const response = await apiClient.post('/auth/password-reset/request', { email });
    return response.data;
};

/**
 * Verifica si un token de reset es válido
 */
export const verifyResetToken = async (token) => {
    const response = await apiClient.post('/auth/password-reset/verify', { token });
    return response.data;
};

/**
 * Completa el reset de contraseña con el token y la nueva contraseña
 */
export const completePasswordReset = async (token, newPassword) => {
    const response = await apiClient.post('/auth/password-reset/complete', {
        token,
        new_password: newPassword
    });
    return response.data;
};
