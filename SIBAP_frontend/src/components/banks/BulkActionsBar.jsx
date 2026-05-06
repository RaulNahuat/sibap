import { Trash2 } from 'lucide-react';

export default function BulkActionsBar({ selectedCount, onDeleteSelected }) {
    if (selectedCount === 0) return null;

    return (
        <div className="mt-4 px-0 sm:px-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="max-w-6xl mx-auto">
                <div className="p-2.5 sm:p-3 bg-red-600 text-white rounded-xl shadow-md flex items-center justify-between gap-3 border border-red-700/50">
                    <div className="flex items-center gap-2.5 pl-1">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <Trash2 className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm font-semibold">{selectedCount} <span className="hidden sm:inline">banco{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}</span></span>
                    </div>
                    <button
                        onClick={onDeleteSelected}
                        className="flex items-center gap-1.5 bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition-all shadow-sm active:scale-95"
                    >
                        <span className="hidden sm:inline">Eliminar permanentemente</span>
                        <span className="inline sm:hidden">Eliminar</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
