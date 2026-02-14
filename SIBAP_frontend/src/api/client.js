import axios from 'axios';
import { createBrowserHistory } from 'history';

export const history = createBrowserHistory();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': '1', // Header simple para protección CSRF básica
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
 * Manejo global de errores HTTP y auto-refresh de tokens
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      console.error('[API] No se pudo conectar con el servidor');
      return Promise.reject(error);
    }

    const { status, data, config } = error.response;
    const backendMessage = data?.detail || data?.message;

    if (status === 401 && !config._retry) {
      const isRefreshEndpoint = config.url?.includes('/auth/refresh');
      const isInitialAuthCheck = config.url?.includes('/auth/me');

      if (!isRefreshEndpoint && !isInitialAuthCheck) {
        config._retry = true;

        try {
          await apiClient.post('/auth/refresh');

          return apiClient(config);
        } catch (refreshError) {
          const publicRoutes = ['/login', '/register'];
          if (!publicRoutes.includes(window.location.pathname)) {
            console.log('[API] Sesión expirada, redirigiendo a login...');
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }
    }

    if (status === 401 && config.url?.includes('/auth/me')) {
      return Promise.reject(error);
    }

    console.error(`[API Error ${status}]:`, backendMessage || 'Sin mensaje del backend');

    return Promise.reject(error);
  }
);

export default apiClient;