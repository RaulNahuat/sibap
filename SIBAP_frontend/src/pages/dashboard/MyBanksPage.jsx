import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Calendar,
    CheckCircle,
    Clock,
    Trash2,
    Download,
    Edit3,
    FolderOpen,
} from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import { getUserBanks, deleteUserBank } from '../../api/dashboard';
import { toast } from 'react-hot-toast';

export default function MyBanksPage() {
    const navigate = useNavigate();
    const [banks, setBanks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, completed, inProgress
    const [deletingBank, setDeletingBank] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBanks();
    }, []);

    const loadBanks = async () => {
        setLoading(true);
        try {
            const data = await getUserBanks();
            if (data) {
                const mappedBanks = data.map(b => ({
                    ...b,
                    lastModified: new Date(b.created_at)
                }));
                setBanks(mappedBanks);
            }
        } catch (error) {
            console.error("Error al cargar bancos:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenBank = (bank) => {
        navigate('/dashboard/validate', { state: { configId: bank.id, name: bank.name, subject: bank.subject } });
    };

    const handleDeleteBank = (bank) => {
        setDeletingBank(bank);
    };

    const confirmDelete = async () => {
        if (deletingBank) {
            try {
                await deleteUserBank(deletingBank.id);
                setBanks(banks.filter(b => b.id !== deletingBank.id));
                toast.success('Banco eliminado correctamente');
            } catch (error) {
                console.error("Error al eliminar banco:", error);
                toast.error('No se pudo eliminar el banco');
            } finally {
                setDeletingBank(null);
            }
        }
    };

    const handleExport = (bank) => {
        alert(`Exportando banco: ${bank.name}`);
        // TODO: Implement export logic
    };

    // Filter banks
    const filteredBanks = banks.filter(bank => {
        const matchesSearch = bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bank.subject.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'completed' && bank.is_completed) ||
            (filterStatus === 'inProgress' && !bank.is_completed);

        return matchesSearch && matchesFilter;
    });

    const formatDate = (date) => {
        if (!date) return '';
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Hoy';
        if (days === 1) return 'Ayer';
        if (days < 7) return `Hace ${days} días`;
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#102129] mb-2">
                    Mis Bancos de Preguntas
                </h1>
                <p className="text-[15px] text-[#64748b]">
                    Gestiona y continúa trabajando en tus bancos guardados.
                </p>
            </div>

            {/* Filters and Search */}
            <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o materia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#64748b]" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full sm:w-auto px-4 py-2.5 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all bg-white"
                        >
                            <option value="all">Todos</option>
                            <option value="completed">Completados</option>
                            <option value="inProgress">En progreso</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                <div className="bg-white border border-[#e2e8f0]/60 rounded-xl p-2 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 hover:shadow-md transition-all">
                    <div className="w-7 h-7 sm:w-10 sm:h-10 bg-[#e9f5f8] rounded-full sm:rounded-lg flex items-center justify-center shrink-0 mb-1 sm:mb-0">
                        <FolderOpen className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#1a5276]" />
                    </div>
                    <div className="flex flex-col items-center sm:items-start w-full">
                        <div className="text-[10px] sm:text-xs text-[#64748b] leading-tight order-2 sm:order-1 mt-1 sm:mt-0">Total</div>
                        <div className="text-xl sm:text-2xl font-bold text-[#102129] leading-none order-1 sm:order-2">{banks.length}</div>
                    </div>
                </div>
                <div className="bg-white border border-[#e2e8f0]/60 rounded-xl p-2 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 hover:shadow-md transition-all">
                    <div className="w-7 h-7 sm:w-10 sm:h-10 bg-green-50 rounded-full sm:rounded-lg flex items-center justify-center shrink-0 mb-1 sm:mb-0">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div className="flex flex-col items-center sm:items-start w-full">
                        <div className="text-[10px] sm:text-xs text-[#64748b] leading-tight order-2 sm:order-1 mt-1 sm:mt-0">Validados</div>
                        <div className="text-xl sm:text-2xl font-bold text-[#102129] leading-none order-1 sm:order-2">
                            {banks.filter(b => b.isCompleted).length}
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-[#e2e8f0]/60 rounded-xl p-2 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 hover:shadow-md transition-all">
                    <div className="w-7 h-7 sm:w-10 sm:h-10 bg-amber-50 rounded-full sm:rounded-lg flex items-center justify-center shrink-0 mb-1 sm:mb-0">
                        <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-600" />
                    </div>
                    <div className="flex flex-col items-center sm:items-start w-full">
                        <div className="text-[10px] sm:text-xs text-[#64748b] leading-tight order-2 sm:order-1 mt-1 sm:mt-0">Pendientes</div>
                        <div className="text-xl sm:text-2xl font-bold text-[#102129] leading-none order-1 sm:order-2">
                            {banks.filter(b => !b.isCompleted).length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Banks List */}
            {filteredBanks.length === 0 ? (
                <div className="bg-white border border-[#e2e8f0] rounded-lg p-12 text-center">
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
                <div className="space-y-4">
                    {filteredBanks.map((bank) => (
                        <div
                            key={bank.id}
                            className="bg-white border border-[#e2e8f0]/60 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-[#102129]">
                                            {bank.name}
                                        </h3>
                                        {bank.isCompleted ? (
                                            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Completado
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                En progreso
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-[#64748b]">
                                        <span>📚 {bank.subject}</span>
                                        <span className="hidden xs:inline">•</span>
                                        <span>Dificultad: {bank.difficulty}</span>
                                        <span className="hidden xs:inline">•</span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(bank.lastModified)}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-auto">
                                    {bank.isCompleted && (
                                        <button
                                            onClick={() => handleExport(bank)}
                                            className="p-2 rounded-md text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1a5276] transition-colors"
                                            title="Exportar"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleOpenBank(bank)}
                                        className="p-2 rounded-md text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1a5276] transition-colors"
                                        title="Editar"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBank(bank)}
                                        className="p-2 rounded-md text-[#64748b] hover:bg-red-50 hover:text-red-600 transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-[#64748b]">
                                        Progreso de validación
                                    </span>
                                    <span className="text-xs font-semibold text-[#102129]">
                                        {bank.validatedQuestions}/{bank.totalQuestions} preguntas
                                    </span>
                                </div>
                                <div className="h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${bank.isCompleted ? 'bg-green-500' : 'bg-amber-500'
                                            }`}
                                        style={{ width: `${bank.progressPercentage}%` }}
                                    />
                                </div>
                            </div>

                            {/* Continue Button */}
                            {!bank.isCompleted && (
                                <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
                                    <button
                                        onClick={() => handleOpenBank(bank)}
                                        className="w-full bg-[#1a5276] text-white px-4 py-2.5 rounded-md font-semibold text-sm hover:bg-[#154360] transition-all"
                                    >
                                        Continuar validación
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
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
