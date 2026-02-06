import axios from 'axios';
import { createBrowserHistory } from 'history';

export const history = createBrowserHistory();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respuesta
 * Manejo global de errores HTTP
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('[API] No se pudo conectar con el servidor');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // Log de errores para debugging (incluye el mensaje del backend si existe)
    const backendMessage = data?.detail || data?.message;
    console.error(`[API Error ${status}]:`, backendMessage || 'Sin mensaje del backend');

    // Redirección automática en 401 (solo si no estamos en rutas públicas)
    if (status === 401) {
      const publicRoutes = ['/login', '/register'];
      const currentPath = history.location.pathname;

      if (!publicRoutes.includes(currentPath)) {
        console.warn('[API] Sesión expirada o no autenticado. Redirigiendo a login...');
        history.push('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;