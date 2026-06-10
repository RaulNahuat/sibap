import { useState } from 'react';
import Modal from '../ui/Modal';
import { Plus, X, Info, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DEFAULT_ANSWERS = () => [
    { id: `a_${Date.now()}_1`, text: '', isCorrect: false },
    { id: `a_${Date.now()}_2`, text: '', isCorrect: false },
    { id: `a_${Date.now()}_3`, text: '', isCorrect: false },
    { id: `a_${Date.now()}_4`, text: '', isCorrect: false },
];

export default function EditQuestionModal({
    isOpen,
    onClose,
    question,
    onSave,
}) {
    const isCreateMode = !question;

    const [editedQuestion, setEditedQuestion] = useState({
        name: question?.name || '',
        questionText: question?.questionText || '',
        feedback_correct: question?.feedback_correct || '',
        feedback_incorrect: question?.feedback_incorrect || '',
        question_type: question?.question_type || question?.questionType || 'MCQ',
        answers: question?.answers?.length
            ? question.answers.map(ans => ({ ...ans, feedback: ans.feedback || '' }))
            : DEFAULT_ANSWERS(),
        correctAnswerId: question?.correctAnswerId || null,
    });

    const handleAnswerChange = (answerId, field, newValue) => {
        setEditedQuestion({
            ...editedQuestion,
            answers: editedQuestion.answers.map((ans) =>
                ans.id === answerId ? { ...ans, [field]: newValue } : ans
            ),
        });
    };

    const handleAddAnswer = () => {
        const newAnswer = { 
            id: `answer_${Date.now()}`, 
            text: isMatching ? '|' : '', 
            isCorrect: false 
        };
        setEditedQuestion({
            ...editedQuestion,
            answers: [...editedQuestion.answers, newAnswer],
        });
    };

    const handleRemoveAnswer = (answerId) => {
        if (editedQuestion.answers.length <= 2) {
            toast.error('Debe haber al menos 2 respuestas');
            return;
        }
        setEditedQuestion({
            ...editedQuestion,
            answers: editedQuestion.answers.filter((ans) => ans.id !== answerId),
            correctAnswerId:
                editedQuestion.correctAnswerId === answerId
                    ? editedQuestion.answers[0]?.id
                    : editedQuestion.correctAnswerId,
        });
    };

    const isMatching = editedQuestion.question_type === 'MATCHING' || (
        editedQuestion.question_type === 'MIXED' && 
        editedQuestion.answers.every(a => a.text?.includes('|'))
    );

    const isCalculated = editedQuestion.question_type === 'CALCULATED';

    const handleSave = () => {
        if (!editedQuestion.questionText.trim()) {
            toast.error('La pregunta no puede estar vacía');
            return;
        }

        const correctAns = editedQuestion.answers.find(a => a.id === editedQuestion.correctAnswerId) || 
                           editedQuestion.answers.find(a => a.isCorrect) || 
                           editedQuestion.answers[0];

        if (isCalculated) {
            if (!correctAns || !correctAns.text.trim()) {
                toast.error('Debe ingresar un valor numérico para la respuesta');
                return;
            }
        } else if (isMatching) {
            if (editedQuestion.answers.some((ans) => {
                const parts = ans.text.split('|');
                return !parts[0]?.trim() || !parts[1]?.trim();
            })) {
                toast.error('Todos los pares deben tener texto en ambas columnas');
                return;
            }
        } else {
            if (editedQuestion.answers.some((ans) => !ans.text.trim())) {
                toast.error('Todas las opciones de respuesta deben tener texto');
                return;
            }
            if (!editedQuestion.correctAnswerId) {
                toast.error('Debe seleccionar una respuesta correcta');
                return;
            }
        }

        let finalAnswers = [];
        let finalCorrectAnswerId = editedQuestion.correctAnswerId;

        if (isMatching) {
            finalAnswers = editedQuestion.answers.map((ans) => ({
                ...ans,
                is_correct: true,
                isCorrect: true,
            }));
        } else if (isCalculated) {
            finalAnswers = [
                {
                    ...(correctAns || { id: `a_${Date.now()}_1`, text: '', feedback: '' }),
                    is_correct: true,
                    isCorrect: true,
                }
            ];
            finalCorrectAnswerId = finalAnswers[0].id;
        } else {
            finalAnswers = editedQuestion.answers.map((ans) => ({
                ...ans,
                is_correct: ans.id === editedQuestion.correctAnswerId,
                isCorrect: ans.id === editedQuestion.correctAnswerId,
            }));
        }

        onSave({ 
            ...question, 
            ...editedQuestion, 
            answers: finalAnswers,
            correctAnswerId: finalCorrectAnswerId
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isCreateMode ? 'Nueva Pregunta' : 'Editar Pregunta'}
            maxWidth="max-w-3xl"
        >
            <div className="space-y-6">
                {/* Información del header */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1.5 ml-1">
                            ID Moodle
                        </label>
                        <input
                            type="text"
                            value={editedQuestion.name}
                            onChange={(e) =>
                                setEditedQuestion({
                                    ...editedQuestion,
                                    name: e.target.value,
                                })
                            }
                            className="w-full md:w-1/3 px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all"
                            placeholder="Geometria_P1"
                        />
                    </div>

                    {isCreateMode && (
                        <div>
                            <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1.5 ml-1">
                                Tipo de Pregunta
                            </label>
                            <select
                                value={editedQuestion.question_type}
                                onChange={(e) =>
                                    setEditedQuestion({
                                        ...editedQuestion,
                                        question_type: e.target.value,
                                    })
                                }
                                className="w-full md:w-1/2 px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all cursor-pointer"
                            >
                                <option value="MCQ">Opción Múltiple (MCQ)</option>
                                <option value="MATCHING">Relacionar Columnas (MATCHING)</option>
                                <option value="CALCULATED">Calculada (CALCULATED)</option>
                            </select>
                            {editedQuestion.question_type === 'MATCHING' && (
                                <p className="mt-1.5 ml-1 text-[10px] text-[#94a3b8] italic">
                                    Para relacionar columnas, escribe cada opción como: <span className="font-mono font-semibold">Término | Definición</span>
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1.5 ml-1">
                            Enunciado de la Pregunta
                        </label>
                        <textarea
                            value={editedQuestion.questionText}
                            onChange={(e) =>
                                setEditedQuestion({
                                    ...editedQuestion,
                                    questionText: e.target.value,
                                })
                            }
                            rows={3}
                            className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276]/10 focus:border-[#1a5276] resize-none transition-all leading-relaxed font-medium text-[#102129]"
                            placeholder="Escribe la pregunta aquí..."
                        />
                    </div>
                </div>

                {/* Sección de Retroalimentación General */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-widest ml-1">Retroalimentación General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-green-600 uppercase tracking-widest ml-1">Correcta</label>
                            <textarea
                                value={editedQuestion.feedback_correct}
                                onChange={(e) =>
                                    setEditedQuestion({
                                        ...editedQuestion,
                                        feedback_correct: e.target.value,
                                    })
                                }
                                rows={3}
                                className="w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all resize-none shadow-sm"
                                placeholder="Feedback para acierto..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-red-600 uppercase tracking-widest ml-1">Incorrecta</label>
                            <textarea
                                value={editedQuestion.feedback_incorrect}
                                onChange={(e) =>
                                    setEditedQuestion({
                                        ...editedQuestion,
                                        feedback_incorrect: e.target.value,
                                    })
                                }
                                rows={3}
                                className="w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all resize-none shadow-sm"
                                placeholder="Feedback para error..."
                            />
                        </div>
                    </div>
                </div>

                {/* Sección de Respuestas — adaptada al tipo */}
                <div className="space-y-4 pt-2">

                    {/* ── MATCHING: editor de pares Término | Definición ── */}
                    {isMatching ? (
                        <>
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-widest">Pares a Relacionar</h3>
                                <span className="text-[10px] font-medium text-[#94a3b8] italic">Término → Definición / Concepto</span>
                            </div>

                            {/* Cabecera de columnas */}
                            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1">
                                <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest">Columna A — Definición / Concepto</span>
                                <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest">Columna B — Término</span>
                                <span className="w-7" />
                            </div>

                            <div className="space-y-2">
                                {editedQuestion.answers.map((answer, index) => {
                                    const parts = answer.text.split('|');
                                    const termino = parts[0] ?? '';
                                    const definicion = parts[1] ?? '';

                                    const handlePartChange = (side, value) => {
                                        const newTermino = side === 'left' ? value : termino;
                                        const newDefinicion = side === 'right' ? value : definicion;
                                        handleAnswerChange(answer.id, 'text', `${newTermino}|${newDefinicion}`);
                                    };

                                    return (
                                        <div key={answer.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3">
                                            <input
                                                type="text"
                                                value={termino}
                                                onChange={(e) => handlePartChange('left', e.target.value)}
                                                className="px-3 py-2 bg-white border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5276] transition-all"
                                                placeholder={`Definición ${index + 1}`}
                                            />
                                            <input
                                                type="text"
                                                value={definicion}
                                                onChange={(e) => handlePartChange('right', e.target.value)}
                                                className="px-3 py-2 bg-white border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5276] transition-all"
                                                placeholder={`Término ${index + 1}`}
                                            />
                                            {editedQuestion.answers.length > 2 && (
                                                <button
                                                    onClick={() => handleRemoveAnswer(answer.id)}
                                                    className="p-1.5 text-[#cbd5e1] hover:text-red-500 transition-all"
                                                    title="Eliminar par"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}

                                <button
                                    onClick={handleAddAnswer}
                                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#e2e8f0] rounded-xl text-[#64748b] hover:border-[#1a5276] hover:text-[#1a5276] hover:bg-[#f8fafc] transition-all text-xs font-bold uppercase tracking-widest"
                                >
                                    <Plus className="w-4 h-4" />
                                    Agregar Par
                                </button>
                            </div>
                        </>

                    ) : isCalculated ? (
                        /* ── CALCULATED: editor numérico de respuesta única ── */
                        <>
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-widest flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4 text-green-600 animate-pulse" />
                                    Configuración de Respuesta Calculada
                                </h3>
                                <span className="text-[10px] font-medium text-[#94a3b8] bg-[#f1f5f9] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Numérica Única
                                </span>
                            </div>

                            <div className="space-y-4">
                                {(() => {
                                    const correctAns = editedQuestion.answers.find(a => a.id === editedQuestion.correctAnswerId) ||
                                                       editedQuestion.answers.find(a => a.isCorrect) ||
                                                       editedQuestion.answers[0] ||
                                                       { id: `a_${Date.now()}_1`, text: '', feedback: '' };

                                    const updateCalculatedText = (val) => {
                                        setEditedQuestion(prev => {
                                            const targetId = correctAns.id;
                                            const exists = prev.answers.some(a => a.id === targetId);
                                            const updatedAnswers = exists
                                                ? prev.answers.map(ans => ans.id === targetId ? { ...ans, text: val, isCorrect: true, is_correct: true } : { ...ans, isCorrect: false, is_correct: false })
                                                : [{ ...correctAns, text: val, isCorrect: true, is_correct: true }];
                                            return {
                                                ...prev,
                                                correctAnswerId: targetId,
                                                answers: updatedAnswers
                                            };
                                        });
                                    };

                                    const updateCalculatedFeedback = (val) => {
                                        setEditedQuestion(prev => {
                                            const targetId = correctAns.id;
                                            const exists = prev.answers.some(a => a.id === targetId);
                                            const updatedAnswers = exists
                                                ? prev.answers.map(ans => ans.id === targetId ? { ...ans, feedback: val, isCorrect: true, is_correct: true } : { ...ans, isCorrect: false, is_correct: false })
                                                : [{ ...correctAns, feedback: val, isCorrect: true, is_correct: true }];
                                            return {
                                                ...prev,
                                                correctAnswerId: targetId,
                                                answers: updatedAnswers
                                            };
                                        });
                                    };

                                    return (
                                        <div className="bg-[#fafdfb] border-2 border-[#a7f3d0]/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm hover:border-[#a7f3d0] transition-all duration-300">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-widest ml-1">
                                                    Valor Numérico Correcto
                                                </label>
                                                <div className="relative max-w-md">
                                                    <input
                                                        type="text"
                                                        value={correctAns.text}
                                                        onChange={(e) => updateCalculatedText(e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border border-[#e2e8f0] focus:ring-2 focus:ring-[#10b981]/10 focus:border-[#10b981] rounded-xl text-sm font-semibold font-mono text-[#065f46] transition-all shadow-sm"
                                                        placeholder="Ej: 19 o 15.5"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#065f46] bg-[#d1fae5] px-2.5 py-1 rounded-md uppercase tracking-wider">
                                                        Correcto
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-[#94a3b8] italic ml-1">
                                                    * El sistema exportará este valor exacto a Moodle. Se aplicará una tolerancia de ±0.01 automáticamente.
                                                </p>
                                            </div>

                                            <div className="space-y-2 pt-2">
                                                <div className="flex items-center gap-1.5 ml-1 text-[#b45309]">
                                                    <Info className="w-4 h-4 shrink-0 text-[#d97706]" />
                                                    <label className="block text-[10px] font-bold uppercase tracking-widest">
                                                        Procedimiento de Resolución / Fórmula
                                                    </label>
                                                </div>
                                                <textarea
                                                    value={correctAns.feedback || ''}
                                                    onChange={(e) => updateCalculatedFeedback(e.target.value)}
                                                    rows={4}
                                                    className="w-full px-4 py-3 bg-white border border-[#e2e8f0] focus:ring-2 focus:ring-[#d97706]/10 focus:border-[#d97706] rounded-xl text-xs text-[#78350f] font-medium leading-relaxed transition-all shadow-sm resize-none"
                                                    placeholder="Escribe el desarrollo paso a paso, fórmula utilizada o explicación del cálculo aquí..."
                                                />
                                                <p className="text-[10px] text-[#94a3b8] italic ml-1">
                                                    * Esta explicación se mostrará al estudiante para que comprenda cómo se llegó al resultado.
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </>

                    ) : (
                    /* ── MCQ: editor con radio de correcta ── */
                        <>
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-widest">Opciones de Respuesta</h3>
                                <span className="text-[10px] font-medium text-[#94a3b8] italic">Selecciona el círculo para la correcta</span>
                            </div>

                            <div className="space-y-3">
                                {editedQuestion.answers.map((answer, index) => {
                                    const isCorrect = editedQuestion.correctAnswerId === answer.id;
                                    return (
                                        <div
                                            key={answer.id}
                                            className={`relative p-4 rounded-xl border transition-all ${isCorrect
                                                ? 'bg-green-50/30 border-green-200 ring-1 ring-green-100'
                                                : 'bg-white border-[#f1f5f9]'
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="pt-2">
                                                    <input
                                                        type="radio"
                                                        name="correctAnswer"
                                                        checked={isCorrect}
                                                        onChange={() =>
                                                            setEditedQuestion({
                                                                ...editedQuestion,
                                                                correctAnswerId: answer.id,
                                                            })
                                                        }
                                                        className="w-5 h-5 text-[#1a5276] focus:ring-[#1a5276] border-[#cbd5e1] cursor-pointer"
                                                    />
                                                </div>

                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-wider">Opción {index + 1}</span>
                                                        {isCorrect && <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter bg-green-100 px-2 py-0.5 rounded">Correcta</span>}
                                                    </div>

                                                    <input
                                                        type="text"
                                                        value={answer.text}
                                                        onChange={(e) => handleAnswerChange(answer.id, 'text', e.target.value)}
                                                        className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1a5276] transition-all ${
                                                            isCorrect ? 'bg-white border-green-300' : 'bg-[#fcfdfe] border-[#e2e8f0]'
                                                        }`}
                                                        placeholder={`Texto de la respuesta...`}
                                                    />

                                                    <div className="space-y-1">
                                                        <label className="block text-[9px] font-bold text-[#94a3b8] uppercase tracking-tighter pl-1">
                                                            Retroalimentación específica
                                                        </label>
                                                        <textarea
                                                            value={answer.feedback}
                                                            onChange={(e) => handleAnswerChange(answer.id, 'feedback', e.target.value)}
                                                            rows={1}
                                                            className="w-full px-3 py-1.5 bg-[#f8fafc]/50 border border-[#e2e8f0] border-dashed rounded-lg text-[11px] text-[#64748b] italic focus:outline-none focus:bg-white focus:border-[#1a5276] transition-all resize-none"
                                                            placeholder="Por qué es correcta/incorrecta..."
                                                        />
                                                    </div>
                                                </div>

                                                {editedQuestion.answers.length > 2 && (
                                                    <button
                                                        onClick={() => handleRemoveAnswer(answer.id)}
                                                        className="p-1.5 text-[#cbd5e1] hover:text-red-500 transition-all"
                                                        title="Eliminar opción"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {editedQuestion.answers.length < 6 && (
                                    <button
                                        onClick={handleAddAnswer}
                                        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#e2e8f0] rounded-xl text-[#64748b] hover:border-[#1a5276] hover:text-[#1a5276] hover:bg-[#f8fafc] transition-all text-xs font-bold uppercase tracking-widest"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Agregar Opción
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Acciones */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl border border-[#e2e8f0] text-sm font-semibold text-[#64748b] hover:bg-[#f8fafc] transition-all"
                    >
                        Descartar
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-[#1a5276] text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-[#154360] transition-all shadow-md active:scale-95"
                    >
                        {isCreateMode ? 'Crear Pregunta' : 'Guardar y Cerrar'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
