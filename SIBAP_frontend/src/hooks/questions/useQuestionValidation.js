import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useLocalStorage from '../useLocalStorage';
import { useAuth } from '../../context/AuthContext';
import { getBankQuestions, regenerateQuestion, updateBank, addManualQuestion, deleteQuestion } from '../../api/questions';
import apiClient from '../../api/client';

export function useQuestionValidation(bankData) {
    const { user } = useAuth();
    const configId = bankData?.configId || 'unknown';

    const storageKey = user?.id && configId
        ? `sibap_val_${user.id}_${configId}`
        : `sibap_temp_validation`;
    const [questions, setQuestions, clearQuestions] = useLocalStorage(storageKey, bankData?.questions || []);

    const [editingQuestion, setEditingQuestion] = useState(null);
    const [deletingQuestion, setDeletingQuestion] = useState(null);
    const [regeneratingIds, setRegeneratingIds] = useState(new Set());
    const [regenerateDialogState, setRegenerateDialogState] = useState({ isOpen: false, question: null });
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    //UseEffect para traer las preguntas del banco
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
                            question_type: q.question_type,
                            questionType: q.question_type,
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
                                cognitive_level: bankData.cognitive_level,
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
                                    // Siempre tomar el tipo del servidor (fuente autoritativa)
                                    question_type: serverQ.question_type,
                                    questionType: serverQ.question_type,
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

                            // Agregar preguntas del servidor que no están en el caché local
                            const cachedIds = new Set(questions.map(q => q.id));
                            const newFromServer = mappedQuestions.filter(sq => !cachedIds.has(sq.id));

                            setQuestions([...mergedQuestions, ...newFromServer]);
                        }
                    }
                } catch (error) {
                    console.error("Error al obtener preguntas del banco:", error);
                }
            }
        };

        fetchQuestions();
    }, [bankData?.configId]);

    //Contadores y validador de preguntas
    const validatedCount = questions.filter((q) => q.validationStatus === 'validated').length;
    const totalCount = questions.length;
    const progressPercentage = totalCount > 0 ? (validatedCount / totalCount) * 100 : 0;
    const isValidated = validatedCount === totalCount && totalCount > 0;

    const handleValidate = async (question) => {
        const updatedQuestion = { ...question, validationStatus: 'validated' };
        setQuestions(questions.map((q) => q.id === question.id ? updatedQuestion : q));

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

    const handleEdit = (question) => setEditingQuestion(question);

    //Función para guardar la edición de una pregunta
    const handleSaveEdit = async (updatedQuestion) => {
        setQuestions(questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)));
        setEditingQuestion(null);

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

    const handleDelete = (question) => setDeletingQuestion(question);

    const confirmDelete = async () => {
        const questionToDelete = deletingQuestion;
        setQuestions(questions.filter((q) => q.id !== questionToDelete.id));
        setDeletingQuestion(null);

        try {
            await deleteQuestion(questionToDelete.id);
        } catch (error) {
            console.error('Error al eliminar la pregunta:', error);
            toast.error('No se pudo eliminar la pregunta del servidor. Intenta de nuevo.');
        }
    };

    const handleRegenerateClick = (question) => {
        setRegenerateDialogState({ isOpen: true, question });
    };

    //Función para regenerar una pregunta
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

    //Función para guardar el progreso
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

    //Función para añadir una pregunta manualmente
    const handleAddQuestion = async (newQuestionData) => {
        try {
            const payload = {
                name: newQuestionData.name || null,
                question_text: newQuestionData.questionText,
                feedback_correct: newQuestionData.feedback_correct || null,
                feedback_incorrect: newQuestionData.feedback_incorrect || null,
                question_type: newQuestionData.question_type || 'MCQ',
                options: newQuestionData.answers.map(ans => ({
                    text: ans.text,
                    is_correct: ans.id === newQuestionData.correctAnswerId,
                    feedback: ans.feedback || null
                }))
            };
            const created = await addManualQuestion(bankData.configId, payload);
            const mapped = {
                id: created.id,
                name: created.name,
                questionText: created.question_text,
                question_type: created.question_type,
                questionType: created.question_type,
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
                    cognitive_level: bankData.cognitive_level,
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

    //Función para exportar el banco de preguntas
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

    return {
        questions,
        editingQuestion,
        setEditingQuestion,
        deletingQuestion,
        setDeletingQuestion,
        regeneratingIds,
        regenerateDialogState,
        setRegenerateDialogState,
        isAddingQuestion,
        setIsAddingQuestion,
        isSaving,
        validatedCount,
        totalCount,
        progressPercentage,
        isValidated,
        handleValidate,
        handleEdit,
        handleSaveEdit,
        handleDelete,
        confirmDelete,
        handleRegenerateClick,
        confirmRegenerate,
        handleSaveProgress,
        handleAddQuestion,
        handleExport,
        handleClearProgress
    };
}
