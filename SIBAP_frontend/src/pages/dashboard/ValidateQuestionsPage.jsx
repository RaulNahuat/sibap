import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QuestionCard from '../../components/questions/QuestionCard';
import EditQuestionModal from '../../components/questions/EditQuestionModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import {
    Download,
    FileText,
    ChevronRight,
    CheckCircle,
    Plus,
} from 'lucide-react';
import { useLocalStorage } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import { getBankQuestions, regenerateQuestion, updateBank, addManualQuestion } from '../../api/questions';
import RegenerateDialog from '../../components/questions/RegenerateDialog';
import { toast } from 'react-hot-toast';

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
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const validatedCount = questions.filter(
        (q) => q.validationStatus === 'validated'
    ).length;
    const totalCount = questions.length;
    const progressPercentage = totalCount > 0 ? (validatedCount / totalCount) * 100 : 0;
    const isValidated = validatedCount === totalCount && totalCount > 0;

    const handleValidate = async (question) => {
        const updatedQuestion = { ...question, validationStatus: 'validated' };
        setQuestions(questions.map((q) => q.id === question.id ? updatedQuestion : q));

        // Auto-guardar en el backend de inmediato
        try {
            await updateBank([{
                id: question.id,
                validationStatus: 'validated',
                questionText: question.questionText,
                answers: question.answers
            }]);
        } catch (error) {
            console.error('Error al guardar la validación:', error);
            toast.error('No se pudo guardar la validación. Intenta de nuevo.');
        }
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
            toast.success(`Validación guardada: ${validatedCount}/${totalCount} preguntas validadas.`);
        } catch (error) {
            console.error("Error saving progress", error);
            toast.error("Error al guardar la validación. Intenta de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddQuestion = async (newQuestionData) => {
        try {
            const payload = {
                question_text: newQuestionData.questionText,
                options: newQuestionData.answers.map(ans => ({
                    text: ans.text,
                    is_correct: ans.id === newQuestionData.correctAnswerId,
                }))
            };
            const created = await addManualQuestion(bankData.configId, payload);
            const mapped = {
                id: created.id,
                questionText: created.question_text,
                answers: created.opciones.map(opt => ({
                    id: opt.id,
                    text: opt.option_text,
                    isCorrect: opt.is_correct,
                })),
                correctAnswerId: created.opciones.find(o => o.is_correct)?.id,
                validationStatus: 'validated',
                metadata: {
                    difficulty: bankData.difficulty,
                    topic: bankData.topic,
                    generatedAt: created.created_at,
                },
            };
            setQuestions(prev => [...prev, mapped]);
            toast.success('Pregunta agregada y validada correctamente.');
        } catch (error) {
            console.error('Error al agregar la pregunta:', error);
            toast.error('No se pudo agregar la pregunta. Intenta de nuevo.');
        }
    };

    const handleExport = (format) => {
        clearQuestions();
        toast.success(`Exportando en formato ${format}...`);
        // TODO: Implement actual export logic
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
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#102129] mb-2">
                    Validación de Reactivos
                </h1>
                <p className="text-[15px] text-[#64748b]">
                    Revise y edite las preguntas generadas antes de exportar.
                </p>
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

            {/* Add Question Button */}
            <button
                onClick={() => setIsAddingQuestion(true)}
                className="w-full mt-2 py-3 border-2 border-dashed border-[#e2e8f0] rounded-xl text-sm font-medium text-[#64748b] hover:border-[#1a5276] hover:text-[#1a5276] hover:bg-[#f8fafc] transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Agregar pregunta manual
            </button>

            {/* Export Section at the Bottom */}
            <div className={`mt-8 p-5 rounded-xl border-2 ${isValidated ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'} transition-all`}>
                <div className="flex items-center justify-between gap-6">
                    {/* Left: status text */}
                    <div className="min-w-0">
                        <h3 className={`font-bold text-base ${isValidated ? 'text-green-800' : 'text-gray-700'}`}>
                            {isValidated ? '¡Banco de Preguntas Validado!' : 'Validación en Progreso'}
                        </h3>
                        <p className={`text-sm mt-0.5 ${isValidated ? 'text-green-700' : 'text-gray-500'}`}>
                            {isValidated
                                ? 'Todas las preguntas se guardaron automáticamente. Ya puedes exportar tu examen.'
                                : `Valida las preguntas para habilitar la exportación — ${validatedCount}/${totalCount} completadas.`
                            }
                        </p>
                    </div>
                    {/* Right: export buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => handleExport('XML')}
                            disabled={!isValidated}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-md border font-medium text-sm transition-all ${isValidated
                                ? 'border-[#e2e8f0] text-[#64748b] hover:bg-white hover:text-[#102129] hover:border-[#cbd5e1]'
                                : 'border-gray-200 text-gray-300 cursor-not-allowed bg-transparent'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Exportar XML
                        </button>
                        <button
                            onClick={() => handleExport('GIFT')}
                            disabled={!isValidated}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-white font-semibold text-sm transition-all shadow-sm ${isValidated
                                ? 'bg-[#1a5276] hover:bg-[#154360] hover:shadow'
                                : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <Download className="w-4 h-4" />
                            Exportar a Moodle (GIFT)
                        </button>
                    </div>
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
                    key={editingQuestion.id}
                    isOpen={!!editingQuestion}
                    onClose={() => setEditingQuestion(null)}
                    question={editingQuestion}
                    onSave={handleSaveEdit}
                />
            )}

            {/* Add Question Modal (create mode) */}
            <EditQuestionModal
                key={isAddingQuestion ? 'adding' : 'closed'}
                isOpen={isAddingQuestion}
                onClose={() => setIsAddingQuestion(false)}
                question={null}
                onSave={handleAddQuestion}
            />

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
