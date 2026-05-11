import { FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useMyBanks } from '../../hooks/banks/useMyBanks';
import BankStatsCards from '../../components/banks/BankStatsCards';
import BankFilters from '../../components/banks/BankFilters';
import BankCard from '../../components/banks/BankCard';
import BulkActionsBar from '../../components/banks/BulkActionsBar';
import PageHeader from '../../components/ui/PageHeader';

export default function MyBanksPage() {
    const {
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        deletingBank,
        setDeletingBank,
        loading,
        selectedBanks,
        paginatedBanks,
        currentPage,
        setCurrentPage,
        totalPages,
        filteredCount,
        stats,
        handleOpenBank,
        handleDeleteBank,
        handleExport,
        toggleSelectBank,
        toggleSelectAll,
        handleDeleteSelected,
        confirmDelete
    } = useMyBanks();

    return (
        <div className="max-w-7xl mx-auto pb-32">
            {/* Header */}
            <PageHeader 
                title="Mis Bancos de Preguntas" 
                description="Gestiona, organiza y exporta tus bancos de preguntas. Todo tu progreso se guarda automáticamente para que nunca pierdas el hilo de tu trabajo." 
                className="mb-10"
            />

            {/* Resumen de estadísticas */}
            <BankStatsCards stats={stats} />

            {/* Filtros y búsqueda */}
            <BankFilters 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                filterStatus={filterStatus} 
                setFilterStatus={setFilterStatus} 
            />

            {/* Lista de bancos */}
            <div className="space-y-6">
                {loading ? (
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-20 flex flex-col items-center justify-center">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-[#1a5276]/10 border-t-[#1a5276] rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </div>
                        <p className="mt-6 text-sm font-bold text-[#102129] uppercase tracking-widest">Sincronizando bancos...</p>
                    </div>
                ) : paginatedBanks.length === 0 ? (
                    <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-16 text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <FolderOpen className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-[#102129] mb-2">
                            {searchTerm || filterStatus !== 'all' ? 'Sin resultados' : 'Tu biblioteca está vacía'}
                        </h3>
                        <p className="text-[#64748b] text-[15px] max-w-sm mx-auto mb-8 font-medium">
                            {searchTerm || filterStatus !== 'all'
                                ? 'No encontramos ningún banco que coincida con tu búsqueda actual.'
                                : 'Aún no has creado ningún banco de preguntas. ¡Comienza uno nuevo ahora!'}
                        </p>
                        {(searchTerm || filterStatus !== 'all') && (
                            <button 
                                onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                                className="px-6 py-3 bg-[#1a5276] text-white rounded-2xl font-bold text-sm hover:bg-[#2471a3] transition-all shadow-lg shadow-[#1a5276]/20 active:scale-95"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                        {/* Header de tabla - Oculto en móvil */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-gray-200 shrink-0">
                            <div className="col-span-1 flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedBanks.length === filteredCount && filteredCount > 0}
                                    onChange={toggleSelectAll}
                                    className="w-5 h-5 rounded border-gray-300 text-[#1a5276] focus:ring-[#1a5276] transition-transform active:scale-90"
                                />
                            </div>
                            <div className="col-span-4 text-xs font-medium text-[#7b8a8a]">
                                Nombre del banco
                            </div>
                            <div className="col-span-2 text-xs font-medium text-[#7b8a8a]">
                                Materia / Taxonomía
                            </div>
                            <div className="col-span-2 text-xs font-medium text-[#7b8a8a]">
                                Estado / Validación
                            </div>
                            <div className="col-span-3 text-xs font-medium text-[#7b8a8a] text-right">
                                Acciones
                            </div>
                        </div>

                        {/* Filas de bancos */}
                        <div className="flex flex-col">
                            {paginatedBanks.map((bank) => (
                                <BankCard 
                                    key={bank.id}
                                    bank={bank}
                                    isSelected={selectedBanks.includes(bank.id)}
                                    onToggleSelect={toggleSelectBank}
                                    onOpen={handleOpenBank}
                                    onExport={handleExport}
                                    onDelete={handleDeleteBank}
                                />
                            ))}
                        </div>
                        {/* Paginación */}
                        <div className="flex items-center justify-between p-4 bg-white border-t border-gray-200">
                                <span className="text-sm font-medium text-[#64748b] ml-2">
                                    Mostrando {paginatedBanks.length} de {filteredCount} bancos
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-xl text-[#1a5276] bg-slate-50 hover:bg-[#1a5276] hover:text-white disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-[#1a5276] transition-all active:scale-90"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalPages)].map((_, i) => {
                                            const page = i + 1;
                                            if (totalPages > 7) {
                                                if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                                                    if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="px-1 text-slate-300">...</span>;
                                                    return null;
                                                }
                                            }
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all active:scale-90 ${
                                                        currentPage === page 
                                                            ? 'bg-[#1a5276] text-white shadow-lg shadow-[#1a5276]/20' 
                                                            : 'text-[#64748b] hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-xl text-[#1a5276] bg-slate-50 hover:bg-[#1a5276] hover:text-white disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-[#1a5276] transition-all active:scale-90"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        </>
                )}
            </div>

            {/* Barra de acciones para bancos seleccionados */}
            <BulkActionsBar 
                selectedCount={selectedBanks.length} 
                onDeleteSelected={handleDeleteSelected} 
            />

            {/* Modal de confirmación de eliminación */}
            {deletingBank && (
                <ConfirmModal
                    isOpen={!!deletingBank}
                    onClose={() => setDeletingBank(null)}
                    onConfirm={confirmDelete}
                    title="Eliminar Banco"
                    message={`¿Estás seguro de que deseas eliminar el banco "${deletingBank.name}"? Esta acción no se puede deshacer y perderás todo el progreso.`}
                    confirmText="Sí, eliminar"
                    cancelText="Cancelar"
                    danger
                />
            )}
        </div>
    );
}
