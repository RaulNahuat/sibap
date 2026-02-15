import { useState, useEffect } from 'react';

/**
 * Custom hook to sync state with localStorage
 * @param {string} key - The key to store in localStorage
 * @param {any} initialValue - The initial value if nothing is found in localStorage
 * @returns {[any, Function, Function]} - Returns state, setter, and clearer
 */
export default function useLocalStorage(key, initialValue) {
    // Get stored value from localStorage or use initialValue
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Update localStorage when state changes
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
