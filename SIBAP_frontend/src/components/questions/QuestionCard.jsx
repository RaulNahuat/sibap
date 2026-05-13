import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import {
    CheckCircle,
    AlertCircle,
    Edit3,
    Plus,
    MessageSquare,
    Info,
    RefreshCw,
    Trash2,
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

    const cleanText = (text) => {
        if (!text) return '';
        let res = text;
        res = res.replace(/\\(\d+(?:,\d+)*(?:\.\d+)?)/g, '&#36;$1');
        res = res.replace(/(?<!\\)\$(\d+(?:,\d+)*(?:\.\d+)?(?!\w))/g, '&#36;$1');
        return res;
    };

    return (
        <div
            className={`bg-white border-2 ${status.borderColor} rounded-lg p-4 sm:p-6 transition-all hover:shadow-md`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center text-sm font-semibold shrink-0">
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

                {/* Acciones */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(question)}
                        className="p-2 rounded-md text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1a5276] transition-colors"
                        title="Editar"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    {question.validationStatus !== 'validated' && onRegenerate && (
                        <>
                            {/**
                            <button
                                onClick={() => onRegenerate(question)}
                                disabled={isRegenerating}
                                className={`p-2 rounded-md text-[#64748b] transition-colors ${isRegenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f1f5f9] hover:text-[#1a5276]'
                                    }`}
                                title="Regenerar"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                            </button>
                            */}
                        </>
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

            {/* Texto de la pregunta */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-[#64748b] mb-2">
                    Pregunta
                </label>
                <div className="text-[15px] text-[#102129] leading-relaxed prose prose-slate max-w-none prose-p:my-1 prose-headings:text-lg prose-headings:font-bold prose-headings:text-[#0b2540] prose-a:text-[#1a5276]">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, strict: false }]]}
                        components={{
                            code: ({ node, inline, children, ...props }) => (
                                <code className="bg-slate-100 text-blue-800 px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-slate-200" {...props}>
                                    {children}
                                </code>
                            )
                        }}
                    >
                        {cleanText(question.questionText)}
                    </ReactMarkdown>
                </div>
            </div>

            {/* Respuestas — layout dinámico por tipo */}
            <div className="mb-6">
                <label className="block text-xs font-medium text-[#64748b] mb-3">
                    {question.questionType === 'MATCHING' ? 'Pares a Relacionar' :
                     question.questionType === 'CALCULATED' ? 'Opciones de Respuesta' :
                     'Respuestas'}
                </label>

                {/* ── MATCHING: tabla de dos columnas ── */}
                {question.questionType === 'MATCHING' ? (
                    <div className="overflow-hidden rounded-lg border border-[#e2e8f0]">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#f8fafc]">
                                    <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#64748b] uppercase tracking-wider w-1/2 border-r border-[#e2e8f0]">
                                        Columna A — Definición / Concepto
                                    </th>
                                    <th className="px-6 py-4 text-left text-[13px] font-semibold text-[#64748b] uppercase tracking-wider w-1/2">
                                        Columna B — Término
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {question.answers.map((answer, idx) => {
                                    const parts = answer.text.split('|');
                                    const left = parts[0]?.trim() || answer.text;
                                    const right = parts[1]?.trim() || '—';
                                    return (
                                        <tr key={answer.id} className={`border-t border-[#f1f5f9] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafcff]'}`}>
                                            <td className="px-6 py-4 text-sm font-medium text-[#102129] border-r border-[#e2e8f0]">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, strict: false }]]}
                                                    components={{ p: ({ node, ...props }) => <span {...props} /> }}
                                                >
                                                    {cleanText(left)}
                                                </ReactMarkdown>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#475569]">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, strict: false }]]}
                                                    components={{ p: ({ node, ...props }) => <span {...props} /> }}
                                                >
                                                    {cleanText(right)}
                                                </ReactMarkdown>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                /* ── CALCULATED: tarjetas de opción con fórmula destacada ── */
                ) : question.questionType === 'CALCULATED' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {question.answers.map((answer) => {
                            const isCorrect = answer.id === question.correctAnswerId;
                            return (
                                <div key={answer.id} className="space-y-1">
                                    <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                        isCorrect
                                            ? 'bg-green-50 border-green-300 shadow-sm'
                                            : 'bg-[#f8fafc] border-[#e2e8f0]'
                                    }`}>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                            isCorrect ? 'border-green-600 bg-green-600' : 'border-[#cbd5e1]'
                                        }`}>
                                            {isCorrect && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                        <div className={`text-sm font-mono font-semibold flex-1 prose prose-sm max-w-none prose-p:m-0 prose-p:inline ${
                                            isCorrect ? 'text-green-900' : 'text-[#475569]'
                                        }`}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm, remarkMath]}
                                                rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, strict: false }]]}
                                                components={{ p: ({ node, ...props }) => <span {...props} /> }}
                                            >
                                                {cleanText(answer.text)}
                                            </ReactMarkdown>
                                        </div>
                                        {isCorrect && (
                                            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider bg-green-100 px-2 py-0.5 rounded-full shrink-0">
                                                Correcto
                                            </span>
                                        )}
                                    </div>
                                    {answer.feedback && isCorrect && (
                                        <div className="ml-8 px-3 py-2 bg-amber-50/70 border-l-2 border-amber-300 rounded-r-md">
                                            <p className="text-[11px] text-amber-800 font-medium mb-1 uppercase tracking-wider">Procedimiento:</p>
                                            <div className="text-xs text-amber-900 prose prose-sm max-w-none prose-p:m-0">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, strict: false }]]}
                                                    components={{ p: ({ node, ...props }) => <span {...props} /> }}
                                                >
                                                    {cleanText(answer.feedback)}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                /* ── MCQ / TF / DEFAULT: lista con radio genérico ── */
                ) : (
                    <div className="space-y-2">
                        {question.answers.map((answer) => {
                            const isCorrect = answer.id === question.correctAnswerId;
                            return (
                                <div key={answer.id} className="space-y-1">
                                    <div className={`flex items-center gap-3 p-3 rounded-md border transition-all ${
                                        isCorrect ? 'bg-green-50 border-green-200' : 'bg-[#f8fafc] border-[#e2e8f0]'
                                    }`}>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                            isCorrect ? 'border-green-600 bg-green-600' : 'border-[#cbd5e1]'
                                        }`}>
                                            {isCorrect && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                        <div className={`text-sm flex-1 prose prose-sm max-w-none prose-p:m-0 prose-p:inline ${
                                            isCorrect ? 'text-green-900 font-medium' : 'text-[#475569]'
                                        }`}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm, remarkMath]}
                                                rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, strict: false }]]}
                                                components={{
                                                    p: ({ node, ...props }) => <span {...props} />,
                                                    code: ({ node, inline, children, ...props }) => (
                                                        <code className="bg-slate-100 text-blue-800 px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-slate-200" {...props}>
                                                            {children}
                                                        </code>
                                                    )
                                                }}
                                            >
                                                {cleanText(answer.text)}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    {answer.feedback && (
                                        <div className="ml-6 sm:ml-8 px-3 py-1.5 bg-blue-50/50 border-l-2 border-blue-200 rounded-r-md">
                                            <div className="text-[10px] sm:text-[11px] text-[#1a5276] italic prose prose-sm max-w-none prose-p:m-0 prose-p:inline flex gap-1">
                                                <span className="font-bold uppercase tracking-tighter shrink-0">Nota:</span>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, strict: false }]]}
                                                    components={{ p: ({ node, ...props }) => <span {...props} /> }}
                                                >
                                                    {cleanText(answer.feedback)}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Retroalimentación general */}
            {(question.feedback_correct || question.feedback_incorrect) && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.feedback_correct && (
                        <div className="bg-green-50/30 border border-green-100 rounded-lg p-3">
                            <h4 className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1.5">
                                <MessageSquare className="w-3 h-3" />
                                Feedback Correcto
                            </h4>
                            <div className="text-xs text-green-800 leading-relaxed italic prose prose-sm max-w-none prose-p:m-0">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, strict: false }]]}
                                    components={{
                                        code: ({ node, inline, children, ...props }) => (
                                            <code className="bg-green-100/50 text-green-900 px-1 py-0.5 rounded text-[0.9em] font-mono" {...props}>{children}</code>
                                        )
                                    }}
                                >
                                    {cleanText(question.feedback_correct)}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                    {question.feedback_incorrect && (
                        <div className="bg-red-50/30 border border-red-100 rounded-lg p-3">
                            <h4 className="flex items-center gap-1.5 text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1.5">
                                <MessageSquare className="w-3 h-3" />
                                Feedback Incorrecto
                            </h4>
                            <div className="text-xs text-red-800 leading-relaxed italic prose prose-sm max-w-none prose-p:m-0">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, strict: false }]]}
                                    components={{
                                        code: ({ node, inline, children, ...props }) => (
                                            <code className="bg-red-100/50 text-red-900 px-1 py-0.5 rounded text-[0.9em] font-mono" {...props}>{children}</code>
                                        )
                                    }}
                                >
                                    {cleanText(question.feedback_incorrect)}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Botón de validar */}
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
