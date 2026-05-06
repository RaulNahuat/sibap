import { useState } from 'react';
import { X, Upload, Link } from 'lucide-react';
import FileUploader from './FileUploader';

const DocumentUploadModal = ({ onClose, onUpload, onDriveImport }) => {
    const [uploadMode, setUploadMode] = useState('local');
    const [driveUrl, setDriveUrl] = useState('');
    const [isDriveLoading, setIsDriveLoading] = useState(false);

    const [driveIsComplex] = useState(false);

    const handleDriveImportClick = async () => {
        const success = await onDriveImport(driveUrl, driveIsComplex, setIsDriveLoading);
        if (success) {
            onClose();
        }
    };

    const handleLocalUpload = async (file, isComplex) => {
        const success = await onUpload(file, isComplex);
        if (success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 transform transition-all scale-100">
                {/* Header del modal */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-[#0b2540]">
                        Agregar documento
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6">
                    <button
                        onClick={() => setUploadMode('local')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                            uploadMode === 'local'
                                ? 'bg-white text-[#1a5276] shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Upload className="w-4 h-4" />
                        Subir archivo
                    </button>
                    <button
                        onClick={() => setUploadMode('drive')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                            uploadMode === 'drive'
                                ? 'bg-white text-[#1a5276] shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Link className="w-4 h-4" />
                        Desde Google Drive
                    </button>
                </div>

                {/* Contenido del tab activo */}
                {uploadMode === 'local' ? (
                    <FileUploader
                        onUpload={handleLocalUpload}
                        acceptedFormats={['.pdf', '.docx', '.pptx', '.txt']}
                        maxSizeMB={10}
                    />
                ) : (
                    <div>
                        {/* Instrucción */}
                        <p className="text-sm text-gray-500 mb-4">
                            Pega el enlace público de Google Drive. El archivo debe estar
                            configurado como <strong>«Cualquiera con el enlace»</strong>.
                            Máximo <strong>10 MB</strong>. Soporta formatos PDF, DOCX, TXT y PPTX.
                        </p>

                        {/* Input URL */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="url"
                                    value={driveUrl}
                                    onChange={(e) => setDriveUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleDriveImportClick()}
                                    placeholder="https://drive.google.com/file/d/..."
                                    className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={handleDriveImportClick}
                                disabled={!driveUrl.trim() || isDriveLoading}
                                className="px-4 py-2 bg-[#1a5276] text-white rounded-lg text-sm font-medium hover:bg-[#145a86] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
                            >
                                {isDriveLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Importando...
                                    </>
                                ) : (
                                    'Importar'
                                )}
                            </button>
                        </div>

                        {/* Consejos */}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <p className="text-xs font-semibold text-blue-700 mb-1">¿Cómo compartir el archivo?</p>
                            <ol className="text-xs text-blue-600 space-y-0.5 list-decimal list-inside">
                                <li>Abre el archivo en Google Drive</li>
                                <li>Clic en <strong>Compartir</strong> → <strong>Cambiar acceso general</strong></li>
                                <li>Selecciona <strong>«Cualquiera con el enlace»</strong></li>
                                <li>Copia el enlace y pégalo aquí</li>
                            </ol>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentUploadModal;
