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
import { useLocalStorage } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import { getBankQuestions, regenerateQuestion, updateBank } from '../../api/questions';
import RegenerateDialog from '../../components/questions/RegenerateDialog';

export default function ValidateQuestionsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const bankData = location.state;

    useEffect(() => {
        if (!bankData) {
            navigate('/dashboard/banks');
        }
    }, [bankData, navigate]);

    const { user } = useAuth();
    const bankId = bankData?.name || 'default-bank';
    const configId = bankData?.configId || 'unknown';

    const storageKey = user?.id && configId
        ? `sibap_val_${user.id}_${configId}`
        : `sibap_temp_validation`;
    const [questions, setQuestions, clearQuestions] = useLocalStorage(storageKey, bankData?.questions || []);

    useEffect(() => {
        const fetchQuestions = async () => {
            if (bankData?.configId) {
                try {
                    const fetchedQuestions = await getBankQuestions(bankData.configId);

                    if (fetchedQuestions && fetchedQuestions.length > 0) {
                        const mappedQuestions = fetchedQuestions.map(q => ({
                            id: q.id,
                            questionText: q.question_text,
                            answers: q.opciones.map(opt => ({
                                id: opt.id,
                                text: opt.option_text,
                                isCorrect: opt.is_correct
                            })),
                            correctAnswerId: q.opciones.find(opt => opt.is_correct)?.id,
                            validationStatus: q.is_validated ? 'validated' : 'pending',
                            metadata: {
                                difficulty: bankData.difficulty,
                                topic: bankData.topic,
                                generatedAt: q.created_at,
                            },
                        }));

                        if (questions.length === 0) {
                            setQuestions(mappedQuestions);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching bank questions:", error);
                }
            }
        };

        fetchQuestions();
    }, [bankData?.configId]);

    const [editingQuestion, setEditingQuestion] = useState(null);
    const [deletingQuestion, setDeletingQuestion] = useState(null);
    const [regeneratingIds, setRegeneratingIds] = useState(new Set());
    const [regenerateDialogState, setRegenerateDialogState] = useState({ isOpen: false, question: null });
    const [isSaving, setIsSaving] = useState(false);

    const validatedCount = questions.filter(
        (q) => q.validationStatus === 'validated'
    ).length;
    const totalCount = questions.length;
    const progressPercentage = totalCount > 0 ? (validatedCount / totalCount) * 100 : 0;
    const isValidated = validatedCount === totalCount && totalCount > 0;

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

    const handleRegenerateClick = (question) => {
        setRegenerateDialogState({ isOpen: true, question });
    };

    const confirmRegenerate = async (modelName) => {
        const question = regenerateDialogState.question;
        if (!question) return;

        setRegenerateDialogState({ ...regenerateDialogState, isOpen: false });
        setRegeneratingIds(prev => new Set(prev).add(question.id));

        try {
            const updatedQData = await regenerateQuestion(question.id, modelName);

            const mappedQuestion = {
                ...question,
                questionText: updatedQData.question_text,
                answers: updatedQData.opciones.map(opt => ({
                    id: opt.id,
                    text: opt.option_text,
                    isCorrect: opt.is_correct
                })),
                correctAnswerId: updatedQData.opciones.find(opt => opt.is_correct)?.id,
                validationStatus: 'pending'
            };

            setQuestions(prev => prev.map(q => q.id === question.id ? mappedQuestion : q));
        } catch (error) {
            console.error("Regeneration failed", error);
            alert("Error al regenerar la pregunta. Intenta de nuevo.");
        } finally {
            setRegeneratingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(question.id);
                return newSet;
            });
            setRegenerateDialogState({ isOpen: false, question: null });
        }
    };

    const handleSaveProgress = async () => {
        setIsSaving(true);
        try {
            const updates = questions.map(q => ({
                id: q.id,
                questionText: q.questionText,
                validationStatus: q.validationStatus,
                answers: q.answers
            }));

            await updateBank(updates);
            alert("Progreso guardado correctamente.");
        } catch (error) {
            console.error("Error saving progress", error);
            alert("Error al guardar el progreso.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = (format) => {
        if (window.confirm(`¿Exportar en formato ${format}? Esto limpiará el progreso guardado.`)) {
            clearQuestions();
            alert(`Exportando en formato ${format}...`);
            // TODO: Implement actual export logic
        }
    };

    const handleClearProgress = () => {
        if (window.confirm('¿Estás seguro de que deseas limpiar todo el progreso guardado?')) {
            clearQuestions();
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

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSaveProgress}
                        disabled={isSaving}
                        className="px-4 py-2 bg-white border border-[#e2e8f0] text-[#1a5276] rounded-lg hover:bg-[#f1f5f9] font-medium transition-colors flex items-center gap-2"
                    >
                        {isSaving ? <div className="w-4 h-4 border-2 border-[#1a5276] border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Guardar Progreso
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
                        onRegenerate={handleRegenerateClick}
                        isRegenerating={regeneratingIds.has(question.id)}
                    />
                ))}
            </div>

            {/* Export Section at the Bottom */}
            <div className={`mt-8 p-6 rounded-xl border-2 ${isValidated ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'} flex items-center justify-between transition-all`}>
                <div>
                    <h3 className={`font-bold text-lg ${isValidated ? 'text-green-800' : 'text-gray-700'}`}>
                        {isValidated ? '¡Banco de Preguntas Validado!' : 'Validación en Progreso'}
                    </h3>
                    <p className={`text-sm ${isValidated ? 'text-green-700' : 'text-gray-500'}`}>
                        {isValidated
                            ? 'Todas las preguntas han sido revisadas. Ya puedes exportar tu examen.'
                            : `Aún tienes preguntas pendientes. Completa la revisión para habilitar la exportación (${Math.round(progressPercentage)}%).`
                        }
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleExport('XML')}
                        disabled={!isValidated}
                        className={`flex items-center gap-2 px-5 py-3 rounded-md border font-medium transition-all ${isValidated
                            ? 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#102129] hover:border-[#cbd5e1]'
                            : 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                            }`}
                    >
                        <FileText className="w-5 h-5" />
                        Exportar XML
                    </button>
                    <button
                        onClick={() => handleExport('GIFT')}
                        disabled={!isValidated}
                        className={`flex items-center gap-2 px-5 py-3 rounded-md text-white font-semibold transition-all shadow-sm ${isValidated
                            ? 'bg-[#1a5276] hover:bg-[#154360] hover:shadow'
                            : 'bg-gray-300 cursor-not-allowed'
                            }`}
                    >
                        <Download className="w-5 h-5" />
                        Exportar a Moodle (GIFT)
                    </button>
                </div>
            </div>

            {/* Modals */}
            <RegenerateDialog
                isOpen={regenerateDialogState.isOpen}
                onClose={() => setRegenerateDialogState({ isOpen: false, question: null })}
                onConfirm={confirmRegenerate}
                isRegenerating={false}
            />



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
