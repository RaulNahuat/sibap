import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QuestionCard from '../../components/questions/QuestionCard';
import EditQuestionModal from '../../components/questions/EditQuestionModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import {
    Download,
    FileText,
    ChevronRight,
    Sparkles,
    CheckCircle,
} from 'lucide-react';

export default function ValidateQuestionsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const bankData = location.state;

    // Redirect if no data provided
    useEffect(() => {
        if (!bankData) {
            navigate('/dashboard/banks');
        }
    }, [bankData, navigate]);

    const bankId = bankData?.name || 'default-bank';
    const storageKey = `sibap_validation_${bankId.replace(/\s+/g, '_')}`;

    // Load saved state from localStorage or use initial data
    const [questions, setQuestions] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error loading saved questions:', e);
            }
        }
        return bankData?.questions || [];
    });

    const [editingQuestion, setEditingQuestion] = useState(null);
    const [deletingQuestion, setDeletingQuestion] = useState(null);

    // Save to localStorage whenever questions change
    useEffect(() => {
        if (questions.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(questions));
        }
    }, [questions, storageKey]);

    // Calculate progress
    const validatedCount = questions.filter(
        (q) => q.validationStatus === 'validated'
    ).length;
    const totalCount = questions.length;
    const progressPercentage = totalCount > 0 ? (validatedCount / totalCount) * 100 : 0;

    const handleValidate = (question) => {
        setQuestions(
            questions.map((q) =>
                q.id === question.id ? { ...q, validationStatus: 'validated' } : q
            )
        );
    };

    const handleEdit = (question) => {
        setEditingQuestion(question);
    };

    const handleSaveEdit = (updatedQuestion) => {
        setQuestions(
            questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
        );
        setEditingQuestion(null);
    };

    const handleDelete = (question) => {
        setDeletingQuestion(question);
    };

    const confirmDelete = () => {
        setQuestions(questions.filter((q) => q.id !== deletingQuestion.id));
        setDeletingQuestion(null);
    };

    const handleRegenerate = (question) => {
        // Simulate regeneration
        setQuestions(
            questions.map((q) =>
                q.id === question.id
                    ? { ...q, validationStatus: 'pending', questionText: q.questionText + ' (Regenerada)' }
                    : q
            )
        );
    };

    const handleExport = (format) => {
        // Clear saved progress after successful export
        if (window.confirm(`¿Exportar en formato ${format}? Esto limpiará el progreso guardado.`)) {
            localStorage.removeItem(storageKey);
            alert(`Exportando en formato ${format}...`);
            // TODO: Implement actual export logic
        }
    };

    const handleClearProgress = () => {
        if (window.confirm('¿Estás seguro de que deseas limpiar todo el progreso guardado?')) {
            localStorage.removeItem(storageKey);
            setQuestions(bankData?.questions || []);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[#64748b] mb-6">
                <button
                    onClick={() => navigate('/dashboard/banks')}
                    className="hover:text-[#1a5276] transition-colors"
                >
                    Mis Bancos
                </button>
                <ChevronRight className="w-4 h-4" />
                <span className="text-[#102129] font-medium">
                    {bankData?.name || 'Historia Universal - Rev. Industrial'}
                </span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#102129] mb-2">
                        Validación de Reactivos
                    </h1>
                    <p className="text-[15px] text-[#64748b]">
                        Revise y edite las preguntas generadas antes de exportar.
                    </p>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleExport('XML')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#102129] hover:border-[#cbd5e1] transition-all"
                    >
                        <FileText className="w-4 h-4" />
                        Exportar XML
                    </button>
                    <button
                        onClick={() => handleExport('GIFT')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#1a5276] text-white text-sm font-semibold hover:bg-[#154360] transition-all shadow-sm hover:shadow"
                    >
                        <Download className="w-4 h-4" />
                        Exportar a Moodle (GIFT)
                    </button>
                </div>
            </div>

            {/* Bank Info Card - Sticky */}
            <div className="sticky top-0 z-10 bg-[#f4f7f6] pb-4 -mx-8 px-8">
                <div className="bg-white border border-[#e2e8f0] rounded-lg p-6 shadow-sm">
                    <div className="grid grid-cols-4 gap-6">
                        <div>
                            <div className="text-xs font-medium text-[#64748b] mb-1">
                                MATERIA
                            </div>
                            <div className="text-base font-semibold text-[#102129]">
                                {bankData?.subject || 'Historia Universal'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-medium text-[#64748b] mb-1">
                                DIFICULTAD
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-base font-semibold text-[#102129]">
                                    {bankData?.difficulty || 'Media'}
                                </span>
                                <span className="px-2 py-0.5 bg-[#e9f5f8] text-[#1a5276] text-xs font-medium rounded">
                                    Nivel 2
                                </span>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-medium text-[#64748b]">
                                    PROGRESO DE VALIDACIÓN
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-green-600">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Guardado automáticamente</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-500"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                <span className="text-sm font-semibold text-green-600 whitespace-nowrap">
                                    {validatedCount}/{totalCount} Completado
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4 mb-8">
                {questions.map((question, index) => (
                    <QuestionCard
                        key={question.id}
                        question={question}
                        questionNumber={index + 1}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onValidate={handleValidate}
                        onRegenerate={handleRegenerate}
                    />
                ))}
            </div>

            {/* Bottom Actions */}
            {validatedCount === totalCount && totalCount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-green-900 mb-1">
                                ¡Todas las preguntas validadas!
                            </h3>
                            <p className="text-sm text-green-700">
                                Tu banco está listo para exportar a Moodle o guardar en tus bancos.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleExport('GIFT')}
                        className="bg-green-600 text-white px-6 py-3 rounded-md font-semibold text-sm flex items-center gap-2 hover:bg-green-700 transition-all shadow-sm hover:shadow"
                    >
                        <Download className="w-4 h-4" />
                        Exportar Ahora
                    </button>
                </div>
            )}

            {/* Edit Modal */}
            {editingQuestion && (
                <EditQuestionModal
                    isOpen={!!editingQuestion}
                    onClose={() => setEditingQuestion(null)}
                    question={editingQuestion}
                    onSave={handleSaveEdit}
                />
            )}

            {/* Delete Confirmation */}
            {deletingQuestion && (
                <ConfirmModal
                    isOpen={!!deletingQuestion}
                    onClose={() => setDeletingQuestion(null)}
                    onConfirm={confirmDelete}
                    title="Eliminar Pregunta"
                    message={`¿Estás seguro de que deseas eliminar la pregunta "${deletingQuestion.questionText}"? Esta acción no se puede deshacer.`}
                    confirmText="Sí, eliminar"
                    cancelText="Cancelar"
                    danger
                />
            )}
        </div>
    );
}
