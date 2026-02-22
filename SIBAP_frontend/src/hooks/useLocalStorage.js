import { useState, useEffect } from 'react';

/**
 * Custom hook para sincronizar el estado con localStorage
 * @param {string} key - La clave para almacenar en localStorage
 * @param {any} initialValue - El valor inicial si no se encuentra en localStorage
 * @returns {[any, Function, Function]} - Retorna el estado, el setter y el clearer
 */
export default function useLocalStorage(key, initialValue) {
    // Obtiene el valor almacenado en localStorage o usa el valor inicial
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Actualiza localStorage cuando el estado cambia
    useEffect(() => {
        try {
            if (storedValue === undefined) {
                window.localStorage.removeItem(key);
            } else {
                window.localStorage.setItem(key, JSON.stringify(storedValue));
            }
        } catch (error) {
            console.error(`Error writing to localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    const clear = () => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.error(`Error clearing localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setStoredValue, clear];
}
