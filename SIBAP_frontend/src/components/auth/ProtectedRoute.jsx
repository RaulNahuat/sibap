import { useAuth } from '../../context/AuthContext';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * Install: pnpm add react-router-dom
 */

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading">
                <p>Cargando...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login
        window.location.href = '/login';
        return null;
    }

    return children;
}
