import { useState } from 'react';
import {
    CheckCircle,
    AlertCircle,
    Edit3,
    Trash2,
    RefreshCw,
} from 'lucide-react';

export default function QuestionCard({
    question,
    questionNumber,
    onEdit,
    onDelete,
    onValidate,
    onRegenerate,
    isRegenerating,
}) {
    const [isExpanded, setIsExpanded] = useState(true);

    const getStatusConfig = () => {
        switch (question.validationStatus) {
            case 'validated':
                return {
                    icon: CheckCircle,
                    label: 'Validado',
                    bgColor: 'bg-green-50',
                    textColor: 'text-green-700',
                    borderColor: 'border-green-200',
                    iconColor: 'text-green-600',
                };
            case 'pending':
                return {
                    icon: AlertCircle,
                    label: 'Pendiente de revisión',
                    bgColor: 'bg-amber-50',
                    textColor: 'text-amber-700',
                    borderColor: 'border-amber-200',
                    iconColor: 'text-amber-600',
                };
            default:
                return {
                    icon: AlertCircle,
                    label: 'Pendiente',
                    bgColor: 'bg-gray-50',
                    textColor: 'text-gray-700',
                    borderColor: 'border-gray-200',
                    iconColor: 'text-gray-600',
                };
        }
    };

    const status = getStatusConfig();
    const StatusIcon = status.icon;

    return (
        <div
            className={`bg-white border-2 ${status.borderColor} rounded-lg p-6 transition-all hover:shadow-md`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {questionNumber}
                    </div>
                    <div className="flex flex-col gap-1">
                        <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full w-fit ${status.bgColor}`}
                        >
                            <StatusIcon className={`w-4 h-4 ${status.iconColor}`} />
                            <span className={`text-xs font-medium ${status.textColor}`}>
                                {status.label}
                            </span>
                        </div>
                        {question.name && (
                            <span className="text-[10px] font-mono text-[#94a3b8] px-1 uppercase tracking-tight">
                                {question.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(question)}
                        className="p-2 rounded-md text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1a5276] transition-colors"
                        title="Editar"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    {question.validationStatus !== 'validated' && onRegenerate && (
                        <button
                            onClick={() => onRegenerate(question)}
                            disabled={isRegenerating}
                            className={`p-2 rounded-md text-[#64748b] transition-colors ${isRegenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f1f5f9] hover:text-[#1a5276]'
                                }`}
                            title="Regenerar"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(question)}
                        className="p-2 rounded-md text-[#64748b] hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Question Text */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-[#64748b] mb-2">
                    Pregunta
                </label>
                <p className="text-[15px] text-[#102129] leading-relaxed">
                    {question.questionText}
                </p>
            </div>

            {/* Answers */}
            <div className="mb-6">
                <label className="block text-xs font-medium text-[#64748b] mb-3">
                    Respuestas
                </label>
                <div className="space-y-2">
                    {question.answers.map((answer) => {
                        const isCorrect = answer.id === question.correctAnswerId;
                        return (
                            <div
                                key={answer.id}
                                className={`flex items-center gap-3 p-3 rounded-md border transition-all ${isCorrect
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-[#f8fafc] border-[#e2e8f0]'
                                    }`}
                            >
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isCorrect
                                        ? 'border-green-600 bg-green-600'
                                        : 'border-[#cbd5e1]'
                                        }`}
                                >
                                    {isCorrect && (
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <span
                                    className={`text-sm ${isCorrect
                                        ? 'text-green-900 font-medium'
                                        : 'text-[#475569]'
                                        }`}
                                >
                                    {answer.text}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Validate Button */}
            {question.validationStatus !== 'validated' && (
                <div className="flex justify-end">
                    <button
                        onClick={() => onValidate(question)}
                        className="bg-green-600 text-white px-5 py-2.5 rounded-md font-semibold text-sm flex items-center gap-2 hover:bg-green-700 transition-all shadow-sm hover:shadow"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Validar y Guardar
                    </button>
                </div>
            )}
        </div>
    );
}
