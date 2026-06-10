import { FileText, Download } from 'lucide-react';

import { toast } from 'react-hot-toast';

const ExportSection = ({ isValidated, validatedCount, totalCount, handleExport }) => {
    return (
        <div className={`mt-8 p-4 sm:p-5 rounded-xl border-2 ${isValidated ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'} transition-all`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                {/* Texto de estado */}
                <div className="min-w-0">
                    <h3 className={`font-bold text-sm sm:text-base ${isValidated ? 'text-green-800' : 'text-gray-700'}`}>
                        {isValidated ? '¡Banco de Preguntas Validado!' : 'Validación en Progreso'}
                    </h3>
                    <p className={`text-xs sm:text-sm mt-0.5 ${isValidated ? 'text-green-700' : 'text-gray-500'}`}>
                        {isValidated
                            ? 'Ya puedes exportar tu examen.'
                            : `Valida las preguntas para habilitar la exportación (${validatedCount}/${totalCount}).`
                        }
                    </p>
                </div>

                {/* Botones de exportación */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => toast('Estamos trabajando para implementar esta nueva funcionalidad.', {
                            icon: '🔧',
                        })}
                        disabled={!isValidated}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md border font-medium text-xs sm:text-sm transition-all ${isValidated
                            ? 'border-[#e2e8f0] text-[#64748b] hover:bg-white hover:text-[#102129] hover:border-[#cbd5e1]'
                            : 'border-gray-200 text-gray-300 cursor-not-allowed bg-transparent'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        GIFT
                    </button>
                    <button
                        onClick={() => handleExport('XML')}
                        disabled={!isValidated}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-white font-semibold text-xs sm:text-sm transition-all shadow-sm ${isValidated
                            ? 'bg-[#1a5276] hover:bg-[#154360] hover:shadow'
                            : 'bg-gray-300 cursor-not-allowed'
                            }`}
                    >
                        <Download className="w-4 h-4" />
                        Exportar XML
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportSection;
