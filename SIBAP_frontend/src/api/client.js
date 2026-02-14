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
 * Manejo global de errores HTTP
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('[API] No se pudo conectar con el servidor');
      return Promise.reject(error);
    }

    const { status, data, config } = error.response;
    const backendMessage = data?.detail || data?.message;

    // No loguear error 401 si es la verificación inicial de usuario (/auth/me)
    if (status === 401 && config.url?.includes('/auth/me')) {
      return Promise.reject(error);
    }

    console.error(`[API Error ${status}]:`, backendMessage || 'Sin mensaje del backend');

    if (status === 401) {
      const publicRoutes = ['/login', '/register'];
      const currentPath = history.location.pathname; // Nota: esto podría necesitar corrección si history no está actualizado

      if (!publicRoutes.includes(window.location.pathname)) {
        // Redirigir solo si no estamos ya en login/register
        // window.location.href = '/login'; // O usar history.push si funciona
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;