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
import apiClient from '../../api/client';

export default function MyBanksPage() {
    const navigate = useNavigate();
    const [banks, setBanks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, completed, inProgress
    const [deletingBank, setDeletingBank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedBanks, setSelectedBanks] = useState([]);

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
                    isCompleted: b.isCompleted !== undefined ? b.isCompleted : b.is_completed,
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

    const handleExport = async (bank) => {
        try {
            const format = 'xml';
            const endpoint = `/api/questions/bank/${bank.id}/export/${format}`;
            const response = await apiClient.get(endpoint, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `banco_${bank.id}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(`Exportación a XML completada.`);
        } catch (error) {
            console.error('Error en la exportación:', error);
            toast.error('No se pudo exportar el banco de preguntas.');
        }
    };

    const toggleSelectBank = (id) => {
        setSelectedBanks(prev => 
            prev.includes(id) ? prev.filter(bankId => bankId !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = () => {
        if (selectedBanks.length === 0) return;
        setDeletingBank({ id: 'multiple', name: `${selectedBanks.length} bancos seleccionados`, count: selectedBanks.length });
    };

    const confirmDelete = async () => {
        if (!deletingBank) return;

        try {
            if (deletingBank.id === 'multiple') {
                for (const id of selectedBanks) {
                    await deleteUserBank(id);
                }
                setBanks(banks.filter(b => !selectedBanks.includes(b.id)));
                setSelectedBanks([]);
                toast.success(`${deletingBank.count} bancos eliminados`);
            } else {
                await deleteUserBank(deletingBank.id);
                setBanks(banks.filter(b => b.id !== deletingBank.id));
                toast.success('Banco eliminado correctamente');
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
            toast.error('Ocurrió un error al eliminar');
        } finally {
            setDeletingBank(null);
        }
    };

    // Filtra los bancos
    const filteredBanks = banks.filter(bank => {
        const matchesSearch = bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bank.subject.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'completed' && bank.isCompleted) ||
            (filterStatus === 'inProgress' && !bank.isCompleted);

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

                    {/* Filtro de estado */}
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

            {/* Resumen de estadísticas */}
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

            {/* Lista de bancos con scroll interno */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[60vh] sm:max-h-[70vh]">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
                    {filteredBanks.length === 0 ? (
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
                            <div
                                key={bank.id}
                                className={`group relative bg-white border ${selectedBanks.includes(bank.id) ? 'border-[#1a5276] bg-[#eaf3f7]/30' : 'border-gray-100'} rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4`}
                            >
                                {/* Selección de casilla */}
                                <div className="sm:pt-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedBanks.includes(bank.id)}
                                        onChange={() => toggleSelectBank(bank.id)}
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
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#64748b] font-medium">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{bank.subject}</span>
                                        <span className="flex items-center gap-1">
                                            Dificultad: <span className="text-[#102129]">
                                                {bank.difficulty === 'EASY' ? 'Básico' :
                                                    bank.difficulty === 'MEDIUM' ? 'Intermedio' :
                                                        bank.difficulty === 'HARD' ? 'Avanzado' : bank.difficulty}
                                            </span>
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
                                                onClick={() => handleExport(bank)}
                                                className="p-2 rounded-xl text-[#1a5276] bg-slate-50 hover:bg-[#1a5276] hover:text-white transition-all shadow-sm"
                                                title="Exportar"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleOpenBank(bank)}
                                            className="p-2 rounded-xl text-[#1a5276] bg-slate-50 hover:bg-[#1a5276] hover:text-white transition-all shadow-sm"
                                            title={bank.isCompleted ? "Ver" : "Continuar"}
                                        >
                                            {bank.isCompleted ? <FolderOpen className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBank(bank)}
                                            className="p-2 rounded-xl text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Barra de acciones para bancos seleccionados*/}
            {selectedBanks.length > 0 && (
                <div className="mt-4 px-0 sm:px-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="max-w-6xl mx-auto">
                        <div className="p-2.5 sm:p-3 bg-red-600 text-white rounded-xl shadow-md flex items-center justify-between gap-3 border border-red-700/50">
                            <div className="flex items-center gap-2.5 pl-1">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                    <Trash2 className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-sm font-semibold">{selectedBanks.length} <span className="hidden sm:inline">banco{selectedBanks.length !== 1 ? 's' : ''} seleccionado{selectedBanks.length !== 1 ? 's' : ''}</span></span>
                            </div>
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-1.5 bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition-all shadow-sm active:scale-95"
                            >
                                <span className="hidden sm:inline">Eliminar permanentemente</span>
                                <span className="inline sm:hidden">Eliminar</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
