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
            className={`flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 md:py-3 border-b border-gray-100 hover:bg-slate-50/50 transition-colors md:items-center group last:border-0 ${isSelected ? 'bg-[#eaf3f7]/30' : ''}`}
        >
            {/* Selección y Nombre */}
            <div className="col-span-5 flex items-start gap-4">
                <div className="mt-1 shrink-0 md:mt-0">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(bank.id)}
                        className="w-5 h-5 rounded border-gray-300 text-[#1a5276] focus:ring-[#1a5276] transition-transform active:scale-90"
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-[#102129] truncate mb-1" title={bank.name}>
                        {bank.name}
                    </h3>
                    <p className="text-[13px] text-[#475569] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Modificado: {formatDate(bank.lastModified)}
                    </p>
                </div>
            </div>

            {/* Materia y Taxonomía */}
            <div className="col-span-2 flex flex-col gap-1 ml-9 md:ml-0">
                <span className="text-sm text-[#475569] truncate" title={bank.subject}>
                    {bank.subject}
                </span>
                <div className="flex flex-wrap items-center gap-1">
                    {(() => {
                        const raw = bank.cognitive_level;
                        if (!raw) return <span className="text-[10px] text-slate-400 italic">Sin taxonomía</span>;
                        const levels = Array.isArray(raw) ? raw : raw.split(',').map(l => l.trim());
                        return (
                            <>
                                <span className="px-1.5 py-0.5 bg-[#e9f5f8] text-[#1a5276] rounded text-[10px] font-semibold whitespace-nowrap">
                                    {levels[0]}
                                </span>
                                {levels.length > 1 && (
                                    <span className="text-[10px] text-[#64748b] font-medium">+{levels.length - 1}</span>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Estado y Progreso */}
            <div className="col-span-2 flex flex-col gap-2 ml-9 md:ml-0">
                <div className="flex items-center gap-2">
                    {bank.isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" /> Completado
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                            <Clock className="w-3 h-3" /> En progreso
                        </span>
                    )}
                </div>
                <div className="w-full max-w-[120px]">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-tighter">Validación</span>
                        <span className="text-[10px] font-extrabold text-[#102129]">{bank.validatedQuestions}/{bank.totalQuestions}</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-700 ease-out ${bank.isCompleted ? 'bg-[#1a5276]' : 'bg-amber-400'}`}
                            style={{ width: `${bank.progressPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div className="col-span-3 flex items-center justify-end gap-2 mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-gray-100 w-full md:w-auto">
                {bank.isCompleted && (
                    <button
                        onClick={() => onExport(bank)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 text-[#1a5276] rounded-lg hover:bg-[#1a5276] hover:text-white transition-all text-xs font-bold border border-slate-200"
                        title="Exportar"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="md:hidden">Exportar</span>
                    </button>
                )}
                <button
                    onClick={() => onOpen(bank)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 text-[#1a5276] rounded-lg hover:bg-[#1a5276] hover:text-white transition-all text-xs font-bold border border-slate-200"
                    title={bank.isCompleted ? "Ver" : "Continuar"}
                >
                    {bank.isCompleted ? <FolderOpen className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                    <span className="md:hidden">{bank.isCompleted ? "Ver" : "Editar"}</span>
                </button>
                <button
                    onClick={() => onDelete(bank)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all text-xs font-bold border border-red-100"
                    title="Eliminar"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="md:hidden">Borrar</span>
                </button>
            </div>
        </div>
    );

}
