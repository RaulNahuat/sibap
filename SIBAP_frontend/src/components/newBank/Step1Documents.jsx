import { Loader2, UploadCloud, Library, FileText, X, RotateCcw } from 'lucide-react';

export default function Step1Documents({
    uploadedFiles,
    isUploading,
    handleFileUpload,
    setShowLibraryModal,
    setUploadedFiles,
    removeFile,
    formData,
    setFormData
}) {
    return (
        <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl overflow-hidden shadow-md mb-6">
            <div className="p-4 sm:p-5 border-b border-[#f1f5f9] flex items-center gap-3 bg-slate-50">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1a5276] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    1
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#102129]">Carga de Insumos</h2>
            </div>

            <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
                    {/* Controles de carga */}
                    <div className="lg:col-span-2 space-y-4">
                        <div
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFileUpload(e); }}
                            className="relative flex flex-col items-center justify-center h-32 sm:h-40 w-full border-2 border-dashed border-[#cbd5e1] rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] hover:border-[#1a5276] transition-all cursor-pointer group"
                        >
                            <input
                                type="file"
                                id="file-upload"
                                multiple
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                accept=".pdf,.docx,.pptx,.txt"
                            />
                            <div className="p-3 rounded-full bg-white shadow-sm mb-3 group-hover:scale-110 transition-transform text-[#1a5276]">
                                {isUploading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <UploadCloud className="w-6 h-6" />
                                )}
                            </div>
                            <div className="text-center px-4">
                                <p className="text-sm font-bold text-[#102129] mb-1">
                                    Subir Archivos
                                </p>
                                <p className="text-[11px] text-[#64748b]">
                                    Arrastra aquí o <span className="text-[#1a5276] underline">explora</span>
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowLibraryModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-sm font-semibold text-[#1a5276] hover:bg-[#f1f5f9] transition-all shadow-sm"
                        >
                            <Library className="w-4 h-4" />
                            <span className="hidden xs:inline">Seleccionar de</span> Mis Documentos
                        </button>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                            <p className="text-[10px] text-[#1a5276] leading-relaxed italic">
                                Suporta: PDF, DOCX, PPTX, TXT (Máx. 10MB)
                            </p>
                        </div>
                    </div>

                    {/* Documentos seleccionados y Referencias externas */}
                    <div className="lg:col-span-3 flex flex-col gap-4">
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-2 px-1">
                                <h3 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                                    Documentos ({uploadedFiles.length})
                                </h3>
                                {uploadedFiles.length > 0 && (
                                    <button
                                        onClick={() => setUploadedFiles([])}
                                        className="text-[10px] text-red-500 hover:text-red-700 font-bold transition-colors"
                                    >
                                        QUITAR TODOS
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 bg-[#fdfdfd] rounded-xl border border-[#f1f5f9] min-h-[120px] max-h-[180px] overflow-y-auto custom-scrollbar p-2">
                                {uploadedFiles.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-[#94a3b8]">
                                        <FileText className="w-8 h-8 mb-2 opacity-10" />
                                        <p className="text-[11px] font-medium italic">No hay documentos seleccionados</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {uploadedFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center justify-between bg-white border border-[#e2e8f0] p-2 rounded-lg shadow-sm hover:border-[#1a5276] transition-all group border-l-4 border-l-[#1a5276]/20 hover:border-l-[#1a5276]"
                                            >
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className="w-7 h-7 rounded bg-[#f1f5f9] flex items-center justify-center shrink-0">
                                                        <FileText className="w-3.5 h-3.5 text-[#1a5276]" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[12px] font-medium text-[#102129] truncate" title={file.filename}>
                                                            {file.filename}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeFile(file.id)}
                                                    className="text-[#cbd5e1] hover:text-red-500 p-1 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">
                                Referencias Externas (Opcional)
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-[#e2e8f0] rounded-xl text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] bg-slate-50 min-h-[80px] transition-all"
                                placeholder="Pega aquí URLs o bibliografía adicional..."
                                value={formData.externalReferences}
                                onChange={(e) => setFormData({ ...formData, externalReferences: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
