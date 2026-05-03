import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../api/auth';

/**
 * Contexto de autenticación
 * Administra el estado global de autenticación del usuario
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const userData = await getCurrentUser();
            setUser(userData);
            setIsAuthenticated(true);
        } catch (error) {
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async () => {
        try {
            const userData = await getCurrentUser();
            setUser(userData);
            setIsAuthenticated(true);
            return true;
        } catch (error) {
            console.error("Error al obtener usuario tras login:", error);
            return false;
        }
    };

    const update = (userData) => {
        setUser(userData);
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sibap_')) {
                localStorage.removeItem(key);
            }
        });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                loading,
                login,
                update,
                logout,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};
