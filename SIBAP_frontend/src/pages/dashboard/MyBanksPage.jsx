import { FolderOpen } from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useMyBanks } from '../../hooks/banks/useMyBanks';
import BankStatsCards from '../../components/banks/BankStatsCards';
import BankFilters from '../../components/banks/BankFilters';
import BankCard from '../../components/banks/BankCard';
import BulkActionsBar from '../../components/banks/BulkActionsBar';

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
        filteredBanks,
        stats,
        handleOpenBank,
        handleDeleteBank,
        handleExport,
        toggleSelectBank,
        handleDeleteSelected,
        confirmDelete
    } = useMyBanks();

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#102129] mb-2">
                    Mis Bancos de Preguntas
                </h1>
                <p className="text-[15px] text-[#64748b]">
                    Gestiona y continúa trabajando en tus bancos guardados.
                </p>
            </div>

            {/* Filtros y búsqueda */}
            <BankFilters 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                filterStatus={filterStatus} 
                setFilterStatus={setFilterStatus} 
            />

            {/* Resumen de estadísticas */}
            <BankStatsCards stats={stats} />

            {/* Lista de bancos con scroll interno */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[60vh] sm:max-h-[70vh]">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="w-10 h-10 border-4 border-[#1a5276] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-sm text-[#64748b]">Cargando bancos...</p>
                            </div>
                        </div>
                    ) : filteredBanks.length === 0 ? (
                        <div className="p-12 text-center">
                            <FolderOpen className="w-12 h-12 text-[#cbd5e1] mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-[#102129] mb-1">
                                {searchTerm || filterStatus !== 'all' ? 'No se encontraron bancos' : 'No tienes bancos guardados'}
                            </h3>
                            <p className="text-sm text-[#64748b]">
                                {searchTerm || filterStatus !== 'all'
                                    ? 'Intenta ajustar tus filtros de búsqueda'
                                    : 'Crea tu primer banco de preguntas para comenzar'}
                            </p>
                        </div>
                    ) : (
                        filteredBanks.map((bank) => (
                            <BankCard 
                                key={bank.id}
                                bank={bank}
                                isSelected={selectedBanks.includes(bank.id)}
                                onToggleSelect={toggleSelectBank}
                                onOpen={handleOpenBank}
                                onExport={handleExport}
                                onDelete={handleDeleteBank}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Barra de acciones para bancos seleccionados*/}
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
