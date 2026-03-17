import { useState } from 'react';
import Modal from '../ui/Modal';
import { Plus, X } from 'lucide-react';
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
    question,     // null = create mode, object = edit mode
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
        onSave({ ...question, ...editedQuestion });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isCreateMode ? 'Nueva Pregunta' : 'Editar Pregunta'}
            maxWidth="max-w-3xl"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Question Name */}
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">
                            ID Moodle (Nombre)
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
                            className="w-full px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent transition-all"
                            placeholder="ej: Geometria_P1"
                        />
                        <p className="mt-1.5 text-[10px] text-[#94a3b8] italic">
                            Nombre único para identificar la pregunta en el banco.
                        </p>
                    </div>

                    {/* Question Text */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">
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
                            className="w-full px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent resize-none transition-all leading-relaxed"
                            placeholder="Escribe la pregunta aquí..."
                        />
                    </div>
                </div>

                {/* General Feedback Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
                    <div>
                        <label className="block text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1.5">
                            Retroalimentación si es Correcta
                        </label>
                        <textarea
                            value={editedQuestion.feedback_correct}
                            onChange={(e) =>
                                setEditedQuestion({
                                    ...editedQuestion,
                                    feedback_correct: e.target.value,
                                })
                            }
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-green-500 transition-all resize-none"
                            placeholder="Mensaje para cuando acierten..."
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1.5">
                            Retroalimentación si es Incorrecta
                        </label>
                        <textarea
                            value={editedQuestion.feedback_incorrect}
                            onChange={(e) =>
                                setEditedQuestion({
                                    ...editedQuestion,
                                    feedback_incorrect: e.target.value,
                                })
                            }
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-red-500 transition-all resize-none"
                            placeholder="Mensaje para cuando fallen..."
                        />
                    </div>
                </div>

                <div className="h-px bg-[#e2e8f0] w-full" />

                {/* Answers */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider">
                            Opciones de Respuesta
                        </label>
                        <span className="text-[11px] text-[#94a3b8]">
                            Selecciona el círculo para la respuesta correcta
                        </span>
                    </div>

                    <div className="space-y-2">
                        {editedQuestion.answers.map((answer, index) => {
                            const isCorrect = editedQuestion.correctAnswerId === answer.id;
                            return (
                                <div
                                    key={answer.id}
                                    className={`relative group p-3 rounded-xl border-2 transition-all ${isCorrect
                                        ? 'bg-green-50/50 border-green-200'
                                        : 'bg-white border-[#f1f5f9] hover:border-[#e2e8f0]'
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
                                                className="w-5 h-5 text-[#1a5276] focus:ring-[#1a5276] border-[#cbd5e1] transition-all cursor-pointer"
                                            />
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-wider">Opción {index + 1}</span>
                                                {isCorrect && <span className="text-[9px] font-bold text-green-600 uppercase">Correcta</span>}
                                            </div>

                                            <input
                                                type="text"
                                                value={answer.text}
                                                onChange={(e) => handleAnswerChange(answer.id, 'text', e.target.value)}
                                                className={`w-full px-4 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276] transition-all ${isCorrect ? 'bg-white border-green-200' : 'bg-[#fcfdfe] border-[#e2e8f0]'
                                                    }`}
                                                placeholder={`Contenido de la respuesta...`}
                                            />

                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-tighter">
                                                    Retroalimentación (Moodle)
                                                </label>
                                                <textarea
                                                    value={answer.feedback}
                                                    onChange={(e) => handleAnswerChange(answer.id, 'feedback', e.target.value)}
                                                    rows={2}
                                                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] border-dashed rounded-lg text-xs text-[#64748b] italic focus:outline-none focus:ring-1 focus:ring-[#1a5276] transition-all resize-none"
                                                    placeholder="Explica por qué esta respuesta es correcta o incorrecta..."
                                                />
                                            </div>
                                        </div>

                                        {editedQuestion.answers.length > 2 && (
                                            <button
                                                onClick={() => handleRemoveAnswer(answer.id)}
                                                className="p-1.5 text-[#94a3b8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Eliminar opción"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add Answer Button */}
                    {editedQuestion.answers.length < 6 && (
                        <button
                            onClick={handleAddAnswer}
                            className="mt-3 flex items-center gap-2 text-sm font-medium text-[#1a5276] hover:text-[#154360]"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar respuesta
                        </button>
                    )}
                </div>

                {/* Hint */}
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-md p-3">
                    <p className="text-xs text-[#64748b]">
                        💡 Selecciona el círculo junto a la respuesta correcta
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-md border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#102129] transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-[#1a5276] text-white px-5 py-2.5 rounded-md font-semibold text-sm hover:bg-[#154360] transition-all shadow-sm hover:shadow"
                    >
                        {isCreateMode ? 'Agregar Pregunta' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
