/**
 * Utilidad centralizada para manejo de errores de API
 * Prioriza los mensajes del backend (detail) y provee fallbacks inteligentes
 */

/**
 * Extrae el mensaje de error del backend de forma consistente
 * @param {Error} error
 * @returns {string}
 */
export const getErrorMessage = (error) => {
    if (!error.response) {
        return 'No se pudo conectar con el servidor o al base de datos. Verifica tu conexión a internet.';
    }

    const { status, data } = error.response;
    
    if (status === 422) {
        if (Array.isArray(data?.detail)) {
            const validationErrors = data.detail.map(err => {
                const field = err.loc?.[err.loc.length - 1] || 'campo';
                let message = err.msg || 'inválido';

                message = message.replace(/^Value error,\s*/i, '');
                message = message.replace(/^Assertion error,\s*/i, '');

                const fieldTranslations = {
                    'email': 'Correo',
                    'password': 'Contraseña',
                    'new_password': 'Nueva contraseña',
                    'confirm_password': 'Confirmar contraseña',
                    'name': 'Nombre',
                    'last_name': 'Apellido',
                };

                const translatedField = fieldTranslations[field] || field;

                const lowerMessage = message.toLowerCase();
                const lowerField = field.toLowerCase();

                if (lowerMessage.includes(lowerField) ||
                    lowerMessage.includes(translatedField.toLowerCase())) {
                    return message;
                }

                return `${translatedField}: ${message}`;
            });

            return validationErrors.join('. ');
        }

        if (typeof data?.detail === 'object' && data?.detail !== null) {
            return JSON.stringify(data.detail);
        }

        return data?.detail || 'Error de validación. Verifica los datos ingresados.';
    }

    const backendMessage = data?.detail || data?.message;

    // Mapeo de códigos de estado a mensajes genéricos
    // Solo se usan si el backend NO envió un mensaje específico
    const statusMessages = {
        400: backendMessage || 'Datos inválidos. Verifica la información ingresada.',
        401: backendMessage || 'Credenciales inválidas. Verifica tu correo y contraseña.',
        403: backendMessage || 'No tienes permisos para realizar esta acción.',
        404: backendMessage || 'Recurso no encontrado.',
        409: backendMessage || 'El recurso ya existe. Verifica los datos.',
        422: backendMessage || 'Error de validación. Verifica los datos ingresados.',
        429: backendMessage || 'Demasiados intentos. Espera un momento antes de reintentar.',
        500: 'Error interno del servidor. Intenta más tarde.',
        502: 'Servidor no disponible. Intenta más tarde.',
        503: 'Servicio temporalmente no disponible. Intenta más tarde.',
    };
    return statusMessages[status] || backendMessage || 'Ocurrió un error inesperado. Intenta más tarde.';
};

/**
 * Determina si el error es de validación de formulario
 * @param {Error} error
 * @returns {boolean}
 */
export const isValidationError = (error) => {
    const status = error.response?.status;
    return status === 400 || status === 422;
};

/**
 * Determina si el error es de autenticación
 * @param {Error} error
 * @returns {boolean}
 */
export const isAuthError = (error) => {
    return error.response?.status === 401;
};

/**
 * Determina si el error es de permisos
 * @param {Error} error
 * @returns {boolean}
 */
export const isPermissionError = (error) => {
    return error.response?.status === 403;
};

/**
 * Determina si el error es de rate limiting
 * @param {Error} error
 * @returns {boolean}
 */
export const isRateLimitError = (error) => {
    return error.response?.status === 429;
};
