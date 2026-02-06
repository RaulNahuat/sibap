import { useState } from 'react';
import Modal from '../ui/Modal';
import { Plus, X } from 'lucide-react';

export default function EditQuestionModal({
    isOpen,
    onClose,
    question,
    onSave,
}) {
    const [editedQuestion, setEditedQuestion] = useState({
        questionText: question?.questionText || '',
        answers: question?.answers || [],
        correctAnswerId: question?.correctAnswerId || '',
    });

    const handleAnswerChange = (answerId, newText) => {
        setEditedQuestion({
            ...editedQuestion,
            answers: editedQuestion.answers.map((ans) =>
                ans.id === answerId ? { ...ans, text: newText } : ans
            ),
        });
    };

    const handleAddAnswer = () => {
        const newAnswer = {
            id: `answer_${Date.now()}`,
            text: '',
        };
        setEditedQuestion({
            ...editedQuestion,
            answers: [...editedQuestion.answers, newAnswer],
        });
    };

    const handleRemoveAnswer = (answerId) => {
        if (editedQuestion.answers.length <= 2) {
            alert('Debe haber al menos 2 respuestas');
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
            alert('La pregunta no puede estar vacía');
            return;
        }
        if (editedQuestion.answers.some((ans) => !ans.text.trim())) {
            alert('Todas las respuestas deben tener texto');
            return;
        }
        if (!editedQuestion.correctAnswerId) {
            alert('Debe seleccionar una respuesta correcta');
            return;
        }
        onSave({ ...question, ...editedQuestion });
        onClose();
    };

    if (!question) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Pregunta">
            <div className="space-y-6">
                {/* Question Text */}
                <div>
                    <label className="block text-sm font-medium text-[#102129] mb-2">
                        Texto de la Pregunta
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
                        className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent resize-none"
                        placeholder="Escribe la pregunta aquí..."
                    />
                </div>

                {/* Answers */}
                <div>
                    <label className="block text-sm font-medium text-[#102129] mb-3">
                        Respuestas
                    </label>
                    <div className="space-y-3">
                        {editedQuestion.answers.map((answer, index) => (
                            <div key={answer.id} className="flex items-start gap-3">
                                <input
                                    type="radio"
                                    name="correctAnswer"
                                    checked={editedQuestion.correctAnswerId === answer.id}
                                    onChange={() =>
                                        setEditedQuestion({
                                            ...editedQuestion,
                                            correctAnswerId: answer.id,
                                        })
                                    }
                                    className="mt-3 w-4 h-4 text-[#1a5276] focus:ring-[#1a5276]"
                                />
                                <input
                                    type="text"
                                    value={answer.text}
                                    onChange={(e) => handleAnswerChange(answer.id, e.target.value)}
                                    className="flex-1 px-4 py-2.5 border border-[#e2e8f0] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                                    placeholder={`Respuesta ${index + 1}`}
                                />
                                {editedQuestion.answers.length > 2 && (
                                    <button
                                        onClick={() => handleRemoveAnswer(answer.id)}
                                        className="p-2.5 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
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
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </Modal>
    );
}
