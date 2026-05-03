import { useState, useEffect } from 'react';

/**
 * Hook personalizado para sincronizar el estado con localStorage
 * @param {string} key - La clave para almacenar en localStorage
 * @param {any} initialValue - El valor inicial si no se encuentra en localStorage
 * @returns {[any, Function, Function]} - Retorna el estado, el setter y el clearer
 */
export default function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error leyendo la key de localStorage "${key}":`, error);
            return initialValue;
        }
    });


    useEffect(() => {
        try {
            if (storedValue === undefined) {
                window.localStorage.removeItem(key);
            } else {
                window.localStorage.setItem(key, JSON.stringify(storedValue));
            }
        } catch (error) {
            console.error(`Error escribiendo en la key de localStorage "${key}":`, error);
        }
    }, [key, storedValue]);

    
    const clear = () => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.error(`Error al limpiar la key de localStorage "${key}":`, error);
        }
    };

    return [storedValue, setStoredValue, clear];
}
