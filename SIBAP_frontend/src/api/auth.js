import apiClient from './client';

/**
 * Authentication API endpoints
 */

/**
 * Register a new user
 */
export const register = async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
};

/**
 * Login user
 * Returns user data and sets httponly cookie automatically
 */
export const login = async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
};

/**
 * Logout user
 * Removes httponly cookie
 */
export const logout = async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
};

/**
 * Get current user profile (if you implement this endpoint)
 */
export const getCurrentUser = async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
};
