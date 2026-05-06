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
import apiClient from '../../api/client';

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
                            name: q.name,
                            questionText: q.question_text,
                            feedback_correct: q.feedback_correct,
                            feedback_incorrect: q.feedback_incorrect,
                            answers: q.opciones.map(opt => ({
                                id: opt.id,
                                text: opt.option_text,
                                isCorrect: opt.is_correct,
                                feedback: opt.feedback
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
                        } else {
                            const mergedQuestions = questions.map(q => {
                                const serverQ = mappedQuestions.find(sq => sq.id === q.id);
                                if (!serverQ) return q;
                                return {
                                    ...q,
                                    feedback_correct: q.feedback_correct || serverQ.feedback_correct,
                                    feedback_incorrect: q.feedback_incorrect || serverQ.feedback_incorrect,
                                    answers: q.answers.map(ans => {
                                        const serverAns = serverQ.answers.find(sa => sa.id === ans.id);
                                        return {
                                            ...ans,
                                            feedback: ans.feedback || serverAns?.feedback
                                        };
                                    })
                                };
                            });
                            setQuestions(mergedQuestions);
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
                name: question.name,
                validationStatus: 'validated',
                questionText: question.questionText,
                feedback_correct: question.feedback_correct,
                feedback_incorrect: question.feedback_incorrect,
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

    const handleSaveEdit = async (updatedQuestion) => {
        setQuestions(
            questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
        );
        setEditingQuestion(null);

        // Auto-guardar en el backend de inmediato
        try {
            await updateBank([{
                id: updatedQuestion.id,
                name: updatedQuestion.name,
                validationStatus: updatedQuestion.validationStatus,
                questionText: updatedQuestion.questionText,
                feedback_correct: updatedQuestion.feedback_correct,
                feedback_incorrect: updatedQuestion.feedback_incorrect,
                answers: updatedQuestion.answers
            }]);
        } catch (error) {
            console.error('Error al auto-guardar edición:', error);
            toast.error('No se pudo auto-guardar el cambio en el servidor.');
        }
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
                name: updatedQData.name,
                feedback_correct: updatedQData.feedback_correct,
                feedback_incorrect: updatedQData.feedback_incorrect,
                answers: updatedQData.opciones.map(opt => ({
                    id: opt.id,
                    text: opt.option_text,
                    isCorrect: opt.is_correct,
                    feedback: opt.feedback
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
                name: q.name,
                questionText: q.questionText,
                feedback_correct: q.feedback_correct,
                feedback_incorrect: q.feedback_incorrect,
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
                name: newQuestionData.name,
                question_text: newQuestionData.questionText,
                options: newQuestionData.answers.map(ans => ({
                    text: ans.text,
                    is_correct: ans.id === newQuestionData.correctAnswerId,
                    feedback: ans.feedback
                }))
            };
            const created = await addManualQuestion(bankData.configId, payload);
            const mapped = {
                id: created.id,
                name: created.name,
                questionText: created.question_text,
                feedback_correct: created.feedback_correct,
                feedback_incorrect: created.feedback_incorrect,
                answers: created.opciones.map(opt => ({
                    id: opt.id,
                    text: opt.option_text,
                    isCorrect: opt.is_correct,
                    feedback: opt.feedback
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

    const handleExport = async (format) => {
        try {
            const endpoint = `/api/questions/bank/${bankData.configId}/export/${format.toLowerCase()}`;
            const response = await apiClient.get(endpoint, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `banco_${bankData.configId}.${format.toLowerCase() === 'gift' ? 'txt' : 'xml'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(`Exportación a ${format} completada.`);
        } catch (error) {
            console.error('Error en la exportación:', error);
            toast.error('No se pudo exportar el banco de preguntas.');
        }
    };

    const handleClearProgress = () => {
        if (window.confirm('¿Estás seguro de que deseas limpiar todo el progreso guardado?')) {
            clearQuestions();
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-24">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[#64748b] mb-6">
                <button
                    onClick={() => navigate('/dashboard/banks')}
                    className="hover:text-[#1a5276] transition-colors"
                >
                    Mis Bancos
                </button>
                <ChevronRight className="w-4 h-4" />
                <span className="text-[#102129] font-medium truncate max-w-[150px] sm:max-w-none">
                    {bankData?.name || 'Historia Universal - Rev. Industrial'}
                </span>
            </div>

            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-[#102129] mb-1 sm:mb-2">
                    Validación de Reactivos
                </h1>
                <p className="text-sm sm:text-[15px] text-[#64748b]">
                    Revise y edite las preguntas generadas antes de exportar.
                </p>
            </div>

            {/* Tarjeta de información del banco */}
            <div className="sticky top-0 z-10 bg-[#f4f7f6] pb-4">
                <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 sm:p-6 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                                    PROGRESO
                                </div>
                                <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-green-600">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Auto-guardado</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="flex-1 h-1.5 sm:h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-500"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-green-600 whitespace-nowrap">
                                    {validatedCount}/{totalCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de preguntas */}
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

            {/* Botón de agregar pregunta */}
            <button
                onClick={() => setIsAddingQuestion(true)}
                className="w-full mt-2 py-3 border-2 border-dashed border-[#e2e8f0] rounded-xl text-sm font-medium text-[#64748b] hover:border-[#1a5276] hover:text-[#1a5276] hover:bg-[#f8fafc] transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Agregar pregunta manual
            </button>

            {/* Sección de exportación */}
            <div className={`mt-8 p-4 sm:p-5 rounded-xl border-2 ${isValidated ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'} transition-all`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                    {/* Texto de estado */}
                    <div className="min-w-0">
                        <h3 className={`font-bold text-sm sm:text-base ${isValidated ? 'text-green-800' : 'text-gray-700'}`}>
                            {isValidated ? '¡Banco de Preguntas Validado!' : 'Validación en Progreso'}
                        </h3>
                        <p className={`text-xs sm:text-sm mt-0.5 ${isValidated ? 'text-green-700' : 'text-gray-500'}`}>
                            {isValidated
                                ? 'Ya puedes exportar tu examen.'
                                : `Valida las preguntas para habilitar la exportación (${validatedCount}/${totalCount}).`
                            }
                        </p>
                    </div>

                    {/* Botones de exportación */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <button
                            //onClick={() => handleExport('GIFT')}
                            onClick={() => console.log("Exportando a GIFT")}
                            disabled={!isValidated}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md border font-medium text-xs sm:text-sm transition-all ${isValidated
                                ? 'border-[#e2e8f0] text-[#64748b] hover:bg-white hover:text-[#102129] hover:border-[#cbd5e1]'
                                : 'border-gray-200 text-gray-300 cursor-not-allowed bg-transparent'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            GIFT
                        </button>
                        <button
                            onClick={() => handleExport('XML')}
                            disabled={!isValidated}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-white font-semibold text-xs sm:text-sm transition-all shadow-sm ${isValidated
                                ? 'bg-[#1a5276] hover:bg-[#154360] hover:shadow'
                                : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <Download className="w-4 h-4" />
                            Exportar XML
                        </button>
                    </div>
                </div>
            </div>

            {/* Modales */}
            <RegenerateDialog
                isOpen={regenerateDialogState.isOpen}
                onClose={() => setRegenerateDialogState({ isOpen: false, question: null })}
                onConfirm={confirmRegenerate}
                isRegenerating={false}
            />



            {/* Modal de edición */}
            {editingQuestion && (
                <EditQuestionModal
                    key={editingQuestion.id}
                    isOpen={!!editingQuestion}
                    onClose={() => setEditingQuestion(null)}
                    question={editingQuestion}
                    onSave={handleSaveEdit}
                />
            )}

            {/* Modal de agregar pregunta */}
            <EditQuestionModal
                key={isAddingQuestion ? 'adding' : 'closed'}
                isOpen={isAddingQuestion}
                onClose={() => setIsAddingQuestion(false)}
                question={null}
                onSave={handleAddQuestion}
            />

            {/* Modal de confirmación de eliminación */}
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
