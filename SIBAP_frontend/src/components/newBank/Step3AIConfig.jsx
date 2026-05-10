import { Sparkles, Loader2, FileText, Tag, X } from 'lucide-react';

export default function Step3AIConfig({
    formData,
    setFormData,
    isGenerating,
    statusMessage,
    progress,
    handlePreviewPrompt,
    handleGenerate,
    clearFormData,
    clearUploadedFiles,
    setIsPromptEdited,
    setPreviewPromptText,
    aiModels = []
}) {
    const defaultModelId = aiModels.find(m => m.is_default)?.id || aiModels[0]?.id || 'gemini-1.5-flash';

    return (
        <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl p-6 sm:p-8 mb-6 shadow-md">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#1a5276] text-white flex items-center justify-center text-base font-semibold shrink-0">
                    3
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                    Configuración de IA
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="flex text-sm font-medium text-[#102129] mb-2 items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Modelo de Inteligencia Artificial
                    </label>
                    <select
                        className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all"
                        value={formData.aiModel}
                        onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                    >
                        {aiModels.length > 0 ? (
                            aiModels.map((model) => (
                                <option key={model.id} value={model.id}>
                                    {model.name} {model.is_default ? '(Recomendado)' : ''}
                                </option>
                            ))
                        ) : (
                            <option value={formData.aiModel}>Cargando modelos...</option>
                        )}
                    </select>
                    <p className="mt-1.5 text-[11px] text-[#64748b]">
                        Seleccione el modelo según sus necesidades de rapidez o complejidad.
                    </p>
                </div>
                <div className="flex items-end flex-1">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, aiModel: defaultModelId })}
                        className="text-[10px] text-[#1a5276] hover:underline font-medium"
                    >
                        ¿Problemas con el modelo? Restablecer por defecto
                    </button>
                </div>
            </div>
            
            <div className="mb-8">
                <label className="flex text-sm font-medium text-[#102129] mb-2 items-center gap-2">
                    <Tag className="w-4 h-4 text-[#1a5276]" />
                    Conceptos a Evaluar: [lista de técnicas/ideas].
                </label>
                <div className="flex flex-wrap gap-2 p-3 border border-[#e2e8f0] rounded-xl focus-within:ring-4 focus-within:ring-[#1a5276]/10 focus-within:border-[#1a5276] transition-all bg-white min-h-[46px]">
                    {formData.keywords?.map((tag, index) => (
                        <span 
                            key={index} 
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f0f9ff] text-[#1a5276] text-xs font-semibold rounded-lg border border-[#bae6fd] animate-in zoom-in-95 duration-200"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => {
                                    const newKeywords = formData.keywords.filter((_, i) => i !== index);
                                    setFormData({ ...formData, keywords: newKeywords });
                                }}
                                className="hover:text-red-600 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        placeholder={formData.keywords?.length === 0 ? "Ej: Ciclo de vida del software, Modelos de proceso..." : "Agregar más..."}
                        className="flex-1 min-w-[120px] text-sm focus:outline-none bg-transparent"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                const value = e.target.value.trim().replace(',', '');
                                if (value && !formData.keywords?.includes(value)) {
                                    setFormData({ ...formData, keywords: [...(formData.keywords || []), value] });
                                    e.target.value = '';
                                }
                            }
                        }}
                    />
                </div>
                <p className="mt-1.5 text-[11px] text-[#64748b]">
                    Presiona <span className="font-semibold">Enter</span> o <span className="font-semibold">Coma</span> para añadir una palabra. Estas palabras guiarán al sistema para encontrar los mejores fragmentos relacionados con tu tema.
                </p>
            </div>

            <div className="flex flex-col gap-3 mb-8 border-t border-[#e2e8f0] pt-6">
                <h3 className="text-sm font-semibold text-[#102129] mb-1">
                    Retroalimentación Autogenerada
                </h3>
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={formData.generateGeneralFeedback}
                        onChange={(e) => setFormData({ ...formData, generateGeneralFeedback: e.target.checked })}
                        className="w-4 h-4 text-[#1a5276] border-gray-300 rounded focus:ring-[#1a5276]"
                    />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#475569] group-hover:text-[#102129] transition-colors">
                            Generar retroalimentación general
                        </span>
                        <span className="text-[11px] text-[#94a3b8]">Una explicación global para la pregunta al atinar o fallar.</span>
                    </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={formData.generateSpecificFeedback}
                        onChange={(e) => setFormData({ ...formData, generateSpecificFeedback: e.target.checked })}
                        className="w-4 h-4 text-[#1a5276] border-gray-300 rounded focus:ring-[#1a5276]"
                    />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#475569] group-hover:text-[#102129] transition-colors">
                            Generar retroalimentación específica por opción
                        </span>
                        <span className="text-[11px] text-[#94a3b8]">Una justificación detallada para cada opción/distractor.</span>
                    </div>
                </label>
            </div>

            {/* Barra de progreso*/}
            {isGenerating && (
                <div className="mb-6 p-5 bg-[#f0f9ff] border border-[#bae6fd] rounded-xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Loader2 className="w-5 h-5 text-[#0369a1] animate-spin" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#0369a1] leading-none mb-1">
                                    {statusMessage}
                                </p>
                                <p className="text-[11px] text-[#0ea5e9] font-medium">
                                    No cierres esta ventana mientras la IA trabaja
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-black text-[#0369a1]">
                                {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                    <div className="w-full bg-[#e0f2fe] rounded-full h-3 overflow-hidden shadow-inner">
                        <div 
                            className="bg-[#0369a1] h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(3,105,161,0.3)]" 
                            style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 5}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button 
                    onClick={() => {
                        clearFormData();
                        clearUploadedFiles();
                        setIsPromptEdited(false);
                        setPreviewPromptText('');
                    }}
                    className="px-6 py-3 rounded-xl border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-slate-800 transition-all order-3 sm:order-1"
                >
                    Limpiar Todo
                </button>
                <button
                    type="button"
                    onClick={handlePreviewPrompt}
                    disabled={isGenerating}
                    className="px-6 py-3 rounded-xl border border-[#1a5276] text-sm font-bold text-[#1a5276] hover:bg-[#f0f9ff] transition-all flex items-center justify-center gap-2 order-2 sm:order-2"
                >
                    <FileText className="w-4 h-4" />
                    Previsualizar prompt
                </button>
                <button
                    onClick={() => handleGenerate()}
                    disabled={isGenerating}
                    className="bg-[#1a5276] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#154360] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-3"
                >
                    <Sparkles className="w-4 h-4" />
                    {isGenerating ? 'Generando...' : 'Generar Reactivos con IA'}
                </button>
            </div>
        </div>
    );
}
