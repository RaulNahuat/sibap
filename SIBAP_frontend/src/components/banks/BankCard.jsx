import { CheckCircle, Clock, Calendar, Download, FolderOpen, Edit3, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

export default function BankCard({ 
    bank, 
    isSelected, 
    onToggleSelect, 
    onOpen, 
    onExport, 
    onDelete 
}) {
    return (
        <div
            className={`group relative bg-white border ${isSelected ? 'border-[#1a5276] bg-[#eaf3f7]/30' : 'border-gray-100'} rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4`}
        >
            {/* Selección de casilla */}
            <div className="sm:pt-1">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(bank.id)}
                    className="w-5 h-5 rounded border-gray-300 text-[#1a5276] focus:ring-[#1a5276] transition-transform active:scale-90"
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-[17px] font-bold text-[#102129] truncate max-w-[200px] sm:max-w-md">
                        {bank.name}
                    </h3>
                    <div className="flex gap-2">
                        {bank.isCompleted ? (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1 border border-green-100">
                                <CheckCircle className="w-3 h-3" />
                                Completado
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1 border border-amber-100">
                                <Clock className="w-3 h-3" />
                                En progreso
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#64748b] font-medium">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{bank.subject}</span>
                    <span className="flex flex-wrap items-center gap-1">
                        {(() => {
                            const raw = bank.cognitive_level;
                            if (!raw) return <span className="text-[#64748b]">Sin taxonomía</span>;
                            const levels = Array.isArray(raw) ? raw : raw.split(',').map(l => l.trim());
                            return levels.map((level, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-[#e9f5f8] text-[#1a5276] rounded text-[10px] font-semibold whitespace-nowrap">
                                    {level}
                                </span>
                            ));
                        })()}
                    </span>
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(bank.lastModified)}
                    </span>
                </div>
                
                {/* Barra de progreso dentro de la tarjeta */}
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5 px-1">
                        <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-tighter">
                            Validación
                        </span>
                        <span className="text-[10px] font-extrabold text-[#102129]">
                            {bank.validatedQuestions}/{bank.totalQuestions}
                        </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-700 ease-out ${bank.isCompleted ? 'bg-[#1a5276]' : 'bg-amber-400'}`}
                            style={{ width: `${bank.progressPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Acciones - Lado de escritorio / Parte inferior móvil */}
            <div className="flex items-center justify-end gap-2 sm:flex-col sm:justify-start pt-3 sm:pt-0 border-t sm:border-0 border-gray-50">
                <div className="flex items-center gap-1">
                    {bank.isCompleted && (
                        <button
                            onClick={() => onExport(bank)}
                            className="p-2 rounded-xl text-[#1a5276] bg-slate-50 hover:bg-[#1a5276] hover:text-white transition-all shadow-sm"
                            title="Exportar"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onOpen(bank)}
                        className="p-2 rounded-xl text-[#1a5276] bg-slate-50 hover:bg-[#1a5276] hover:text-white transition-all shadow-sm"
                        title={bank.isCompleted ? "Ver" : "Continuar"}
                    >
                        {bank.isCompleted ? <FolderOpen className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => onDelete(bank)}
                        className="p-2 rounded-xl text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Eliminar"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
