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
        const newAnswer = { id: `answer_${Date.now()}`, text: '', isCorrect: false };
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

    const handleSave = () => {
        if (!editedQuestion.questionText.trim()) {
            toast.error('La pregunta no puede estar vacía');
            return;
        }
        if (editedQuestion.answers.some((ans) => !ans.text.trim())) {
            toast.error('Todas las respuestas deben tener texto');
            return;
        }
        if (!editedQuestion.correctAnswerId) {
            toast.error('Debe seleccionar una respuesta correcta');
            return;
        }

        const finalAnswers = editedQuestion.answers.map((ans) => ({
            ...ans,
            is_correct: ans.id === editedQuestion.correctAnswerId,
            isCorrect: ans.id === editedQuestion.correctAnswerId, 
        }));

        onSave({ 
            ...question, 
            ...editedQuestion, 
            answers: finalAnswers 
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

                {/* Sección de Respuestas */}
                <div className="space-y-4 pt-2">
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

                        {/* Botón de Agregar Opción */}
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
