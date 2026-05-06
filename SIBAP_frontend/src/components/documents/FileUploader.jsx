import { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

const FileUploader = ({
    onFileSelect,
    onUpload,
    acceptedFormats = ['.pdf', '.docx', '.pptx', '.txt'],
    maxSizeMB = 10
}) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isComplex, setIsComplex] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const validateFile = (file) => {
        setError('');

        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!acceptedFormats.includes(fileExtension)) {
            setError(`Formato no permitido. Use: ${acceptedFormats.join(', ')}`);
            return false;
        }

        if (file.size > maxSizeBytes) {
            setError(`El archivo excede el tamaño máximo de ${maxSizeMB} MB`);
            return false;
        }

        if (file.size === 0) {
            setError('El archivo está vacío');
            return false;
        }

        return true;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && validateFile(file)) {
            setSelectedFile(file);
            if (onFileSelect) {
                onFileSelect(file);
            }
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && validateFile(file)) {
            setSelectedFile(file);
            if (onFileSelect) {
                onFileSelect(file);
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setError('');

        try {
            await onUpload(selectedFile, isComplex);
        } catch (err) {
            setError(err.message || 'Error al subir el archivo');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClear = () => {
        setSelectedFile(null);
        setIsComplex(false);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="w-full">
            {/* Área de drag & drop */}
            <div
                className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }
          ${selectedFile ? 'bg-gray-50' : 'bg-white'}
        `}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {!selectedFile ? (
                    <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-700 mb-2">
                            Arrastra un archivo aquí
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            o haz clic para seleccionar
                        </p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Seleccionar Archivo
                        </button>
                        <p className="text-xs text-gray-400 mt-4">
                            Formatos: {acceptedFormats.join(', ')} • Máximo {maxSizeMB} MB
                        </p>
                    </>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FileText className="h-10 w-10 text-blue-600" />
                            <div className="text-left">
                                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClear}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            disabled={isUploading}
                        >
                            <X className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedFormats.join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {/* Mensaje de error */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Opciones adicionales */}
            {/*
            {selectedFile && !error && (
                <div className="mt-4 flex items-start space-x-2 text-left">
                    <div className="flex items-center h-5">
                        <input
                            id="complex-file"
                            type="checkbox"
                            checked={isComplex}
                            onChange={(e) => setIsComplex(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                    </div>

                    {/*
                    <div>
                        <label htmlFor="complex-file" className="text-sm font-medium text-gray-900 cursor-pointer">
                            Es un documento complejo
                        </label>
                        <p className="text-xs text-gray-500">Mantiene el archivo original para su análisis avanzado o si tiene mala lectura (ej. tablas sueltas)</p>
                    </div>
                </div>
            )}
            */}

            {/* Botón de upload */}
            {selectedFile && !error && (
                <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className={`
            mt-4 w-full py-3 px-4 rounded-lg font-medium transition-all
            ${isUploading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }
          `}
                >
                    {isUploading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Procesando...
                        </span>
                    ) : (
                        'Extraer Texto'
                    )}
                </button>
            )}
        </div>
    );
};

export default FileUploader;
