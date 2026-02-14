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

export default function MyBanksPage() {
    const navigate = useNavigate();
    const [banks, setBanks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, completed, inProgress
    const [deletingBank, setDeletingBank] = useState(null);

    // Load all banks from localStorage
    useEffect(() => {
        loadBanks();
    }, []);

    const loadBanks = () => {
        const allBanks = [];
        const keys = Object.keys(localStorage);

        keys.forEach(key => {
            if (key.startsWith('sibap_validation_')) {
                try {
                    const questions = JSON.parse(localStorage.getItem(key));
                    if (questions && questions.length > 0) {
                        const bankName = key.replace('sibap_validation_', '').replace(/_/g, ' ');
                        const validatedCount = questions.filter(q => q.validationStatus === 'validated').length;
                        const totalCount = questions.length;
                        const progressPercentage = (validatedCount / totalCount) * 100;

                        allBanks.push({
                            id: key,
                            name: bankName,
                            subject: questions[0]?.metadata?.topic || 'Sin materia',
                            difficulty: questions[0]?.metadata?.difficulty || 'Intermedio',
                            totalQuestions: totalCount,
                            validatedQuestions: validatedCount,
                            progressPercentage,
                            isCompleted: validatedCount === totalCount,
                            lastModified: new Date(questions[0]?.metadata?.generatedAt || Date.now()),
                            questions,
                        });
                    }
                } catch (e) {
                    console.error('Error loading bank:', key, e);
                }
            }
        });

        // Sort by last modified (newest first)
        allBanks.sort((a, b) => b.lastModified - a.lastModified);
        setBanks(allBanks);
    };

    const handleOpenBank = (bank) => {
        // Reconstruct bank data in the format ValidateQuestionsPage expects
        const bankData = {
            name: bank.name,
            subject: bank.subject,
            difficulty: bank.difficulty,
            questions: bank.questions,
            // Add other properties if needed
        };
        navigate('/dashboard/validate', { state: bankData });
    };

    const handleDeleteBank = (bank) => {
        setDeletingBank(bank);
    };

    const confirmDelete = () => {
        if (deletingBank) {
            localStorage.removeItem(deletingBank.id);
            loadBanks();
            setDeletingBank(null);
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
            (filterStatus === 'completed' && bank.isCompleted) ||
            (filterStatus === 'inProgress' && !bank.isCompleted);

        return matchesSearch && matchesFilter;
    });

    const formatDate = (date) => {
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
            <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o materia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#64748b]" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 border border-[#e2e8f0] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                        >
                            <option value="all">Todos</option>
                            <option value="completed">Completados</option>
                            <option value="inProgress">En progreso</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-[#e2e8f0] rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#e9f5f8] rounded-lg flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-[#1a5276]" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#102129]">{banks.length}</div>
                            <div className="text-xs text-[#64748b]">Total de Bancos</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-[#e2e8f0] rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#102129]">
                                {banks.filter(b => b.isCompleted).length}
                            </div>
                            <div className="text-xs text-[#64748b]">Completados</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-[#e2e8f0] rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#102129]">
                                {banks.filter(b => !b.isCompleted).length}
                            </div>
                            <div className="text-xs text-[#64748b]">En Progreso</div>
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
                            className="bg-white border border-[#e2e8f0] rounded-lg p-6 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
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
                                    <div className="flex items-center gap-4 text-sm text-[#64748b]">
                                        <span>📚 {bank.subject}</span>
                                        <span>•</span>
                                        <span>Dificultad: {bank.difficulty}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(bank.lastModified)}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
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
