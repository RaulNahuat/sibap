import { useState, useEffect } from 'react';
import { Info, FileText, RotateCcw, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import Modal from '../ui/Modal';
import { previewPrompt } from '../../api/questions';
import { getErrorMessage } from '../../utils/errorHandler';
import { mapFormDataToRequest } from '../../utils/newBankUtils';
import { useToast } from '../../context/ToastContext';

export default function PromptPreviewModal({
    showPromptModal,
    setShowPromptModal,
    formData,
    uploadedFiles,
    handleGenerate,
    isPromptEdited,
    setIsPromptEdited,
    previewPromptText,
    setPreviewPromptText
}) {
    const { showToast } = useToast();
    const [originalPromptText, setOriginalPromptText] = useState('');
    const [isFetchingPrompt, setIsFetchingPrompt] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchPromptPreview = async () => {
        setIsFetchingPrompt(true);

        try {
            const requestData = mapFormDataToRequest(formData, uploadedFiles);

            const response = await previewPrompt(requestData);
            setPreviewPromptText(response.prompt);
            setOriginalPromptText(response.prompt);
            setIsPromptEdited(false);
        } catch (err) {
            const msg = getErrorMessage(err);
            showToast(msg, 'error');
            setShowPromptModal(false);
        } finally {
            setIsFetchingPrompt(false);
        }
    };

    useEffect(() => {
        if (showPromptModal) {
            fetchPromptPreview();
        }
    }, [showPromptModal]);

    return (
        <Modal
            isOpen={showPromptModal}
            onClose={() => setShowPromptModal(false)}
            title="Previsualizar Prompt de Generación"
            maxWidth="max-w-4xl"
        >
            <div className="flex flex-col gap-4 h-[70vh]">
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-3 items-start shrink-0">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 leading-relaxed">
                        <p className="font-bold mb-1">Nota sobre la edición:</p>
                        <p>Si editas el prompt, se usará exactamente el texto que proporciones. Asegúrate de mantener las instrucciones sobre el formato <strong>JSON</strong> para que el sistema pueda procesar las preguntas correctamente.</p>
                    </div>
                </div>

                <div className="relative flex-1 min-h-0 rounded-xl border border-[#e2e8f0] bg-white shadow-sm flex flex-col">
                    {/* Editor Toolbar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0] bg-slate-50 rounded-t-xl shrink-0">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#1a5276]" />
                            <span className="text-sm font-semibold text-slate-700">prompt_unificado.txt</span>
                        </div>

                        {!isFetchingPrompt && (
                            <div className="flex items-center gap-2">
                                {isPromptEdited && (
                                    <button
                                        onClick={() => {
                                            setPreviewPromptText(originalPromptText);
                                            setIsPromptEdited(false);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                                        title="Restaurar al prompt original generado por el sistema"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Deshacer cambios</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(previewPromptText);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-[#1a5276] hover:bg-[#f0f9ff] transition-colors"
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                    <span className={copied ? "text-emerald-600 font-bold" : ""}>{copied ? 'Copiado' : 'Copiar texto'}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Editor de edición de prompt */}
                    {isFetchingPrompt ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-b-xl">
                            <Loader2 className="w-10 h-10 text-[#1a5276] animate-spin mb-3" />
                            <p className="text-sm font-medium text-slate-500">Construyendo el prompt...</p>
                        </div>
                    ) : (
                        <textarea
                            className="w-full flex-1 p-5 bg-white text-slate-800 font-mono text-sm leading-relaxed focus:outline-none focus:ring-4 focus:ring-[#1a5276]/5 rounded-b-xl resize-none"
                            value={previewPromptText}
                            onChange={(e) => {
                                setPreviewPromptText(e.target.value);
                                setIsPromptEdited(true);
                            }}
                            spellCheck={false}
                        />
                    )}
                    {!isFetchingPrompt && isPromptEdited && (
                        <div className="absolute bottom-4 right-6 pointer-events-none">
                            <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full border border-amber-300 shadow-sm">
                                MODIFICADO MANUALMENTE
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-2 shrink-0">
                    <button
                        onClick={() => setShowPromptModal(false)}
                        className="px-5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-all"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={() => {
                            setShowPromptModal(false);
                            handleGenerate(previewPromptText, isPromptEdited, previewPromptText);
                        }}
                        disabled={isFetchingPrompt || !previewPromptText}
                        className="px-6 py-2.5 rounded-xl bg-[#1a5276] text-white text-sm font-bold flex items-center gap-2 hover:bg-[#154360] transition-all shadow-md disabled:opacity-50"
                    >
                        <Sparkles className="w-4 h-4" />
                        Generar con este prompt
                    </button>
                </div>
            </div>
        </Modal>
    );
}
