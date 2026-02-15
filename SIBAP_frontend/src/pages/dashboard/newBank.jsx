import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UploadCloud,
    FileText,
    Sparkles,
    CheckCircle,
    List,
    Circle,
    MessageSquare,
    X,
    Library,
    Loader2,
    RotateCcw
} from 'lucide-react';
import DocumentSelectionModal from '../../components/documents/DocumentSelectionModal';
import { uploadDocument, getDocument } from '../../api/documents';
import { getErrorMessage } from '../../utils/errorHandler';
import { useLocalStorage } from '../../hooks';

export default function NewBankPage() {
    const navigate = useNavigate();
    const [selectedQuestionType, setSelectedQuestionType] = useLocalStorage('sibap_newbank_type', 'multiple');
    const [uploadedFiles, setUploadedFiles] = useLocalStorage('sibap_newbank_files', []);
    const [formData, setFormData] = useLocalStorage('sibap_newbank_form', {
        program: '',
        semester: '',
        subject: '',
        topic: '',
        subtopic: '',
        difficulty: 'Intermedio',
        questionCount: 10,
        wrongOptionCount: 3,
        plausibleDistractors: false,
        avoidAmbiguity: true,
        externalReferences: '',
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        // Validate form
        if (!formData.subject || !formData.topic) {
            setError('Por favor completa al menos la materia y el tema principal');
            return;
        }

        if (uploadedFiles.length === 0 && !formData.externalReferences) {
            setError('Por favor carga al menos un documento o proporciona referencias externas');
            return;
        }

        setIsGenerating(true);
        setError('');

        // Simulate API call
        setTimeout(() => {
            setIsGenerating(false);

            // Generate mock questions
            const mockQuestions = generateMockQuestions(formData, selectedQuestionType);

            navigate('/dashboard/validate', {
                state: {
                    name: `${formData.subject} - ${formData.topic}`,
                    subject: formData.subject,
                    topic: formData.topic,
                    difficulty: formData.difficulty,
                    program: formData.program,
                    semester: formData.semester,
                    wrongOptionCount: formData.wrongOptionCount,
                    plausibleDistractors: formData.plausibleDistractors,
                    avoidAmbiguity: formData.avoidAmbiguity,
                    externalReferences: formData.externalReferences,
                    questions: mockQuestions,
                    sourceDocuments: uploadedFiles.map(f => f.id)
                }
            });
        }, 2000);
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files || e.dataTransfer.files);
        if (files.length === 0) return;

        setIsUploading(true);
        setError('');

        try {
            const uploadPromises = files.map(file => uploadDocument(file));
            const results = await Promise.all(uploadPromises);

            // results contain {id, filename, file_type, ...}
            setUploadedFiles(prev => {
                // Avoid duplicates
                const existingIds = new Set(prev.map(f => f.id));
                const newFiles = results.filter(r => !existingIds.has(r.id));
                return [...prev, ...newFiles];
            });
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsUploading(false);
        }
    };

    const handleLibrarySelect = async (selectedIds) => {
        setIsUploading(true);
        try {
            // Fetch full details for the selected IDs that we don't already have
            const existingIds = new Set(uploadedFiles.map(f => f.id));
            const idsToFetch = selectedIds.filter(id => !existingIds.has(id));

            const fetchedDocs = await Promise.all(idsToFetch.map(id => getDocument(id)));

            setUploadedFiles(prev => {
                // Keep already uploaded ones that are still in selectedIds
                const filtered = prev.filter(f => selectedIds.includes(f.id));
                return [...filtered, ...fetchedDocs];
            });
        } catch (err) {
            setError('Error al cargar documentos seleccionados');
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = (id) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== id));
    };

    const generateMockQuestions = (data, type) => {
        const questions = [];
        for (let i = 0; i < data.questionCount; i++) {
            const answers = [
                { id: `a1_${i}`, text: 'Opción correcta sobre ' + data.topic, isCorrect: true },
            ];

            const wrongCount = data.wrongOptionCount || 3;
            for (let j = 0; j < wrongCount; j++) {
                answers.push({
                    id: `a${j + 2}_${i}`,
                    text: `Opción incorrecta ${j + 1}`
                });
            }

            // Shuffle answers mainly for display if needed, or keep as is.
            // For now, simple push.

            questions.push({
                id: `q_${i + 1}`,
                questionText: `¿Cuál fue el principal evento de ${data.topic} en el contexto de ${data.subject}?`,
                answers: answers,
                correctAnswerId: `a1_${i}`,
                validationStatus: 'pending',
                metadata: {
                    difficulty: data.difficulty,
                    topic: data.topic,
                    semester: data.semester,
                    generatedAt: new Date(),
                },
            });
        }
        return questions;
    };

    const questionTypes = [
        {
            id: 'multiple',
            label: 'Opción Múltiple',
            icon: List,
        },
        {
            id: 'trueFalse',
            label: 'Verdadero / Falso',
            icon: Circle,
        },
        {
            id: 'open',
            label: 'Respuesta Abierta',
            icon: MessageSquare,
        },
    ];

    const handleClearAll = () => {
        if (window.confirm('¿Estás seguro de que deseas limpiar todos los campos y archivos?')) {
            setFormData({
                program: '',
                semester: '',
                subject: '',
                topic: '',
                subtopic: '',
                difficulty: 'Intermedio',
                questionCount: 10,
                wrongOptionCount: 3,
                plausibleDistractors: false,
                avoidAmbiguity: true,
                externalReferences: '',
            });
            setUploadedFiles([]);
            setSelectedQuestionType('multiple');
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#102129] mb-2">
                        Nuevo Banco de Preguntas
                    </h1>
                    <p className="text-[15px] text-[#64748b]">
                        Completa los 3 pasos para que la Inteligencia Artificial genere tu examen automáticamente.
                    </p>
                </div>
                <button
                    onClick={handleClearAll}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#1a5276] hover:bg-white rounded-md transition-all border border-transparent hover:border-[#e2e8f0]"
                >
                    <RotateCcw className="w-4 h-4" />
                    Limpiar Formulario
                </button>
            </div>

            {/* Step 1: Carga de Insumos */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm mb-6">
                <div className="p-5 border-b border-[#f1f5f9] flex items-center gap-3 bg-[#f8fafc]">
                    <div className="w-8 h-8 rounded-full bg-[#1a5276] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        1
                    </div>
                    <h2 className="text-lg font-bold text-[#102129]">Carga de Insumos</h2>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                        {/* Left Side: Upload Controls */}
                        <div className="md:col-span-2 space-y-4">
                            <div
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFileUpload(e); }}
                                className="relative flex flex-col items-center justify-center aspect-[4/3] w-full border-2 border-dashed border-[#cbd5e1] rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] hover:border-[#1a5276] transition-all cursor-pointer group"
                            >
                                <input
                                    type="file"
                                    id="file-upload"
                                    multiple
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                    accept=".pdf,.docx,.txt"
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
                                Seleccionar de Mis Documentos
                            </button>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <p className="text-[10px] text-[#1a5276] leading-relaxed italic">
                                    Suporta: PDF, DOCX, TXT (Máx. 10MB)
                                </p>
                            </div>
                        </div>

                        {/* Right Side: Selected Documents & External Refs */}
                        <div className="md:col-span-3 flex flex-col gap-4">
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

                                <div className="flex-1 bg-[#fdfdfd] rounded-xl border border-[#f1f5f9] min-h-[160px] max-h-[220px] overflow-y-auto custom-scrollbar p-2">
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
                                                        <div className="w-7 h-7 rounded bg-[#f1f5f9] flex items-center justify-center flex-shrink-0">
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
                                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent bg-[#f8fafc] min-h-[80px]"
                                    placeholder="Pega aquí URLs o bibliografía adicional..."
                                    value={formData.externalReferences}
                                    onChange={(e) => setFormData({ ...formData, externalReferences: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between text-red-700 text-xs">
                            <span className="flex items-center gap-2">
                                <RotateCcw className="w-3 h-3" />
                                {error}
                            </span>
                            <button onClick={() => setError('')} className="font-bold">✕</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Step 2: Parámetros Académicos */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-8 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#1a5276] text-white flex items-center justify-center text-base font-semibold flex-shrink-0">
                        2
                    </div>
                    <h2 className="text-lg font-semibold text-[#102129]">
                        Parámetros Académicos
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Programa Educativo */}
                    <div>
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Programa Educativo
                        </label>
                        <select
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                            value={formData.program}
                            onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        >
                            <option value="">Seleccionar programa...</option>
                            <option>Licenciatura en Ingeniería de Software</option>
                            <option>Licenciatura en Contaduría</option>
                            <option>Licenciatura en Educación</option>
                            <option>Licenciatura en Enfermería</option>
                        </select>
                    </div>

                    {/* Semestre */}
                    <div>
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Semestre / Grado
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. 5to Semestre"
                            value={formData.semester}
                            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                        />
                    </div>

                    {/* Materia / Asignatura */}
                    <div>
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Materia / Asignatura
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Historia Universal"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                        />
                    </div>

                    {/* Tema Principal */}
                    <div>
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Tema Principal
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Revolución Francesa"
                            value={formData.topic}
                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                        />
                    </div>

                    {/* Subtema (Opcional) */}
                    <div>
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Subtema (Opcional)
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Causas sociales y económicas"
                            value={formData.subtopic}
                            onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                        />
                    </div>

                    {/* Nivel de Dificultad */}
                    <div>
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Nivel de Dificultad
                        </label>
                        <select
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                            value={formData.difficulty}
                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                        >
                            <option>Básico</option>
                            <option>Intermedio</option>
                            <option>Avanzado</option>
                        </select>
                    </div>

                    {/* Número de Preguntas */}
                    <div>
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Número de Preguntas
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={formData.questionCount}
                            onChange={(e) => setFormData({ ...formData, questionCount: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                        />
                    </div>

                    {/* Número de Opciones Incorrectas */}
                    <div>
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Opciones Incorrectas por Pregunta
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            value={formData.wrongOptionCount}
                            onChange={(e) => setFormData({ ...formData, wrongOptionCount: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Restricciones Pedagógicas */}
                <div className="mt-8 border-t border-[#e2e8f0] pt-6">
                    <h3 className="text-sm font-semibold text-[#102129] mb-4">
                        Restricciones Pedagógicas
                    </h3>
                    <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.plausibleDistractors}
                                onChange={(e) => setFormData({ ...formData, plausibleDistractors: e.target.checked })}
                                className="w-4 h-4 text-[#1a5276] border-gray-300 rounded focus:ring-[#1a5276]"
                            />
                            <span className="text-sm text-[#475569]">
                                Generar distractores plausibles (evitar opciones obvias)
                            </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.avoidAmbiguity}
                                onChange={(e) => setFormData({ ...formData, avoidAmbiguity: e.target.checked })}
                                className="w-4 h-4 text-[#1a5276] border-gray-300 rounded focus:ring-[#1a5276]"
                            />
                            <span className="text-sm text-[#475569]">
                                Verificar y evitar ambigüedades en los enunciados
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Step 3: Configuración de IA */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-8 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#1a5276] text-white flex items-center justify-center text-base font-semibold flex-shrink-0">
                        3
                    </div>
                    <h2 className="text-lg font-semibold text-[#102129]">
                        Configuración de IA
                    </h2>
                </div>

                {/* Tipo de Reactivo Principal */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-[#102129] mb-4">
                        Tipo de Reactivo Principal
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                        {questionTypes.map((type) => {
                            const Icon = type.icon;
                            const isSelected = selectedQuestionType === type.id;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedQuestionType(type.id)}
                                    className={`p-6 rounded-lg border-2 transition-all ${isSelected
                                        ? 'border-[#1a5276] bg-[#e9f5f8]'
                                        : 'border-[#e2e8f0] hover:border-[#cbd5e1] bg-white'
                                        }`}
                                >
                                    <Icon
                                        className={`w-8 h-8 mx-auto mb-3 ${isSelected ? 'text-[#1a5276]' : 'text-[#64748b]'
                                            }`}
                                    />
                                    <p
                                        className={`text-sm font-medium ${isSelected ? 'text-[#1a5276]' : 'text-[#102129]'
                                            }`}
                                    >
                                        {type.label}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                    <button className="px-6 py-3 rounded-md border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#102129] transition-all">
                        Guardar Borrador
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-[#1a5276] text-white px-6 py-3 rounded-md font-semibold text-sm flex items-center gap-2 hover:bg-[#154360] transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="w-4 h-4" />
                        {isGenerating ? 'Generando...' : 'Generar Reactivos con IA'}
                    </button>
                </div>
            </div>

            {/* Modal */}
            <DocumentSelectionModal
                isOpen={showLibraryModal}
                onClose={() => setShowLibraryModal(false)}
                onSelect={handleLibrarySelect}
                selectedIds={uploadedFiles.map(f => f.id)}
            />
        </div>
    );
}
