import React, { useState } from 'react';
import { Sparkles, Loader2, X, AlertTriangle } from 'lucide-react';

export default function RegenerateDialog({ isOpen, onClose, onConfirm, isRegenerating }) {
    const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');

    if (!isOpen) return null;

    const models = [
        {
            id: 'gemini-flash-latest',
            name: 'Gemini Flash (Estable)',
            description: 'Recomendado para evitar errores de cuota.'
        },
        {
            id: 'gemini-2.0-flash-lite',
            name: 'Gemini 2.0 Flash-Lite',
            description: 'Alta velocidad, ideal para iteraciones rápidas.'
        },
        {
            id: 'gemini-2.0-flash',
            name: 'Gemini 2.0 Flash',
            description: 'Equilibrado en inteligencia y velocidad.'
        },
        {
            id: 'gemma-3-27b-it',
            name: 'Gemma 3 27B (Open Source)',
            description: 'Modelo abierto, alta capacidad de razonamiento.'
        },
        {
            id: 'gemini-3-flash-preview',
            name: 'Gemini 3 Flash (Preview)',
            description: 'Última tecnología experimental.'
        }

    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2 text-[#1a5276]">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <h3 className="font-semibold text-lg">Regenerar Pregunta</h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isRegenerating}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        Selecciona el modelo de Inteligencia Artificial que deseas utilizar para generar la nueva versión de esta pregunta.
                    </p>

                    <div className="space-y-3">
                        {models.map((model) => (
                            <label
                                key={model.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedModel === model.id
                                    ? 'border-[#1a5276] bg-[#e9f5f8] shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="ai-model"
                                    value={model.id}
                                    checked={selectedModel === model.id}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="mt-1 w-4 h-4 text-[#1a5276] border-gray-300 focus:ring-[#1a5276]"
                                />
                                <div>
                                    <span className={`block text-sm font-medium ${selectedModel === model.id ? 'text-[#1a5276]' : 'text-gray-700'
                                        }`}>
                                        {model.name}
                                    </span>
                                    <span className="block text-xs text-gray-500 mt-0.5">
                                        {model.description}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                            La pregunta actual será reemplazada permanentemente. Esta acción no se puede deshacer.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        disabled={isRegenerating}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(selectedModel)}
                        disabled={isRegenerating}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1a5276] hover:bg-[#154360] rounded-lg shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isRegenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Regenerando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Regenerar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
