import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Play, Sparkles, AlertCircle, FileText, CheckCircle, Save, Download, RefreshCw, Loader2, Info, BookOpen, BrainCircuit, GripVertical, Plus, Trash2, X, RotateCcw, UploadCloud, MessageSquare, Library
} from 'lucide-react';
import DocumentSelectionModal from '../../components/documents/DocumentSelectionModal';
import { uploadDocument, getDocument } from '../../api/documents';
import { generateQuestions, checkGenerationStatus, getBankQuestions } from '../../api/questions';
import { getCurriculumSemesters, getCurriculumSubjects, getPrograms } from '../../api/curriculum';
import { getErrorMessage } from '../../utils/errorHandler';
import { useLocalStorage } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function NewBankPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [showClearModal, setShowClearModal] = useState(false);

    const filesKey = user?.id ? `sibap_newbank_files_${user.id}` : 'sibap_newbank_files';
    const formKey = user?.id ? `sibap_newbank_form_${user.id}` : 'sibap_newbank_form';

    const [uploadedFiles, setUploadedFiles, clearUploadedFiles] = useLocalStorage(filesKey, []);
    const [formData, setFormData, clearFormData] = useLocalStorage(formKey, {
        program: '',
        program_id: null,
        semester: '',
        subject: '',
        subject_id: null,
        topic: '',
        subtopic: '',
        learningObjectives: '',
        difficulty: 'Intermedio',
        numMCQ: 5,
        numMatching: 2,
        numCalculated: 1,
        wrongOptionCount: 3,
        plausibleDistractors: false,
        avoidAmbiguity: true,
        customInstructions: '',
        externalReferences: '',
        aiModel: 'gemini-flash-latest',
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [isUploading, setIsUploading] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [error, setError] = useState('');

    // Curriculum cascading state
    const IS_PROGRAM = 'Licenciatura en Ingeniería de Software';
    const isISProgram = formData.program === IS_PROGRAM;
    const [availablePrograms, setAvailablePrograms] = useState([]);
    const [availableSemesters, setAvailableSemesters] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [selectedSemesterNum, setSelectedSemesterNum] = useState('');
    const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
    const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);

    // Load programs on mount
    useEffect(() => {
        setIsLoadingPrograms(true);
        getPrograms()
            .then(progs => setAvailablePrograms(progs))
            .catch(() => setAvailablePrograms([]))
            .finally(() => setIsLoadingPrograms(false));
    }, []);

    // Handle incoming state with selected documents
    useEffect(() => {
        const state = location.state;
        if (state?.selectedDocuments && state.selectedDocuments.length > 0) {
            handleLibrarySelect(state.selectedDocuments);
            // Limpiar el estado para evitar recargas infinitas si el usuario navega de nuevo
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Load semesters when program is selected
    useEffect(() => {
        if (formData.program) {
            setIsLoadingSemesters(true);
            getCurriculumSemesters(formData.program)
                .then(sems => setAvailableSemesters(sems))
                .catch(() => setAvailableSemesters([]))
                .finally(() => setIsLoadingSemesters(false));
        } else {
            setAvailableSemesters([]);
            setAvailableSubjects([]);
            setSelectedSemesterNum('');
        }
    }, [formData.program]);

    useEffect(() => {
        if (formData.program && selectedSemesterNum !== '') {
            setIsLoadingSubjects(true);
            getCurriculumSubjects(formData.program, Number(selectedSemesterNum))
                .then(subjects => {
                    setAvailableSubjects(subjects);
                    setFormData(prev => ({ ...prev, subject: '', subject_id: null }));
                })
                .catch(() => setAvailableSubjects([]))
                .finally(() => setIsLoadingSubjects(false));
        }
    }, [selectedSemesterNum, formData.program]);

    const handleGenerate = async () => {
        if (!formData.subject || !formData.topic) {
            setError('Por favor completa al menos la materia y el tema principal');
            return;
        }

        if (uploadedFiles.length === 0 && !formData.externalReferences) {
            setError('Por favor carga al menos un documento o proporciona referencias externas');
            return;
        }

        setIsGenerating(true);
        setStatusMessage('Iniciando generación...');
        setProgress({ current: 0, total: 0 });
        setError('');

        try {
            const difficultyMapping = {
                'Básico': 'EASY',
                'Intermedio': 'MEDIUM',
                'Avanzado': 'HARD'
            };

            const num_mcq = parseInt(formData.numMCQ) || 0;
            const num_matching = parseInt(formData.numMatching) || 0;
            const num_calculated = parseInt(formData.numCalculated) || 0;

            if (num_mcq + num_matching + num_calculated === 0) {
                setError('Debes especificar al menos 1 pregunta en cualquier tipo');
                setIsGenerating(false);
                return;
            }

            const requestData = {
                document_ids: uploadedFiles.map(f => f.id),
                program_id: formData.program_id,
                subject_id: formData.subject_id,
                program: formData.program,
                subject: formData.subject,
                topic: formData.topic,
                subtopic: formData.subtopic || null,
                learning_objectives: formData.learningObjectives || null,
                question_type: 'MIXED',
                difficulty: difficultyMapping[formData.difficulty] || 'MEDIUM',
                num_mcq,
                num_matching,
                num_calculated,
                num_questions: num_mcq + num_matching + num_calculated,
                model_name: formData.aiModel,
                wrong_option_count: formData.wrongOptionCount,
                plausible_distractors: formData.plausibleDistractors,
                avoid_ambiguity: formData.avoidAmbiguity,
                custom_instructions: formData.customInstructions || null,
                external_references: formData.externalReferences || null
            };

            // 1. Iniciar la generación (asíncrona)
            const initialResponse = await generateQuestions(requestData);
            const { config_id } = initialResponse;
            
            // 2. Iniciar el sondeo (polling)
            const startTime = Date.now();
            const MAX_POLLING_TIME = 3 * 60 * 1000; // 3 minutos

            const pollStatus = async () => {
                try {
                    // Verificación de timeout de seguridad
                    if (Date.now() - startTime > MAX_POLLING_TIME) {
                        throw new Error('Tiempo de espera agotado después de 3 minutos. Revisa el Banco de Preguntas más tarde.');
                    }

                    const statusData = await checkGenerationStatus(config_id);
                    const { status, question_count, total_requested, error_message } = statusData;

                    setProgress({ current: question_count, total: total_requested });

                    if (status === 'COMPLETED') {
                        // Obtener las preguntas finales para navegar
                        const finalQuestions = await getBankQuestions(config_id);
                        handleSuccessfulGeneration(finalQuestions, config_id, requestData);
                    } else if (status === 'FAILED') {
                        throw new Error(error_message || 'La IA falló al generar las preguntas.');
                    } else {
                        // Seguimos procesando: actualizar mensaje y re-agendar
                        setStatusMessage(`Generando preguntas (${question_count}/${total_requested})...`);
                        setTimeout(pollStatus, 3000); // Polling cada 3 segundos
                    }
                } catch (err) {
                    const msg = getErrorMessage(err);
                    setError(msg);
                    toast.error(msg, { duration: 6000 });
                    setIsGenerating(false);
                }
            };

            // Iniciar el ciclo de polling
            pollStatus();

        } catch (err) {
            const msg = getErrorMessage(err);
            setError(msg);
            toast.error(msg, { duration: 6000 });
            setIsGenerating(false);
        }
    };

    const handleSuccessfulGeneration = (questions, config_id, requestData) => {
        const mappedQuestions = questions.map((q, idx) => ({
            id: q.id,
            questionText: q.question_text,
            questionType: q.question_type,
            feedback_correct: q.feedback_correct,
            feedback_incorrect: q.feedback_incorrect,
            answers: q.opciones.map(opt => ({
                id: opt.id,
                text: opt.option_text,
                isCorrect: opt.is_correct,
                feedback: opt.feedback
            })),
            correctAnswerId: q.opciones.find(opt => opt.is_correct)?.id,
            validationStatus: 'pending',
            metadata: {
                difficulty: formData.difficulty,
                topic: formData.topic,
                semester: formData.semester,
                generatedAt: q.created_at,
            },
        }));

        // Limpiar el caché del formulario antes de navegar
        clearFormData();
        clearUploadedFiles();
        
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
                questions: mappedQuestions,
                sourceDocuments: requestData.document_ids,
                configId: config_id
            }
        });
        
        setIsGenerating(false);
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files || e.dataTransfer.files);
        if (files.length === 0) return;

        setIsUploading(true);
        setError('');

        try {
            const uploadPromises = files.map(file => uploadDocument(file));
            const results = await Promise.all(uploadPromises);

            setUploadedFiles(prev => {
                const existingIds = new Set(prev.map(f => f.id));
                const newFiles = results.filter(r => !existingIds.has(r.id));
                return [...prev, ...newFiles];
            });
        } catch (err) {
            const msg = getErrorMessage(err);
            setError(msg);
            toast.error(msg, { duration: 4000 });
        } finally {
            setIsUploading(false);
        }
    };

    const handleLibrarySelect = async (selectedIds) => {
        setIsUploading(true);
        try {
            // Obtener IDs que NO están ya en la lista
            const existingIds = new Set(uploadedFiles.map(f => f.id));
            const idsToFetch = selectedIds.filter(id => !existingIds.has(id));

            // Solo buscar si hay IDs nuevos
            let fetchedDocs = [];
            if (idsToFetch.length > 0) {
                fetchedDocs = await Promise.all(idsToFetch.map(id => getDocument(id)));
            }

            setUploadedFiles(prev => {
                // Mantener solo los archivos que están en la selección actual
                const filtered = prev.filter(f => selectedIds.includes(f.id));
                
                // Añadir los nuevos, asegurando unicidad final por si acaso
                const combined = [...filtered, ...fetchedDocs];
                const seenIds = new Set();
                return combined.filter(doc => {
                    if (seenIds.has(doc.id)) return false;
                    seenIds.add(doc.id);
                    return true;
                });
            });
        } catch (err) {
            const msg = 'Error al cargar documentos seleccionados';
            setError(msg);
            toast.error(msg, { duration: 4000 });
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

    const handleClearAll = () => {
        setShowClearModal(true);
    };

    const confirmClearAll = () => {
        clearFormData();
        clearUploadedFiles();
        setShowClearModal(false);
    };

    return (
        <div className="max-w-5xl mx-auto pb-12 sm:pb-24 px-1 sm:px-0">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#102129] mb-1 sm:mb-2">
                        Nuevo Banco de Preguntas
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#64748b]">
                        Completa los 3 pasos para generar tu examen.
                    </p>
                </div>
                <button
                    onClick={handleClearAll}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#64748b] hover:text-[#1a5276] hover:bg-white rounded-lg transition-all border border-transparent hover:border-[#e2e8f0] self-end sm:self-auto"
                >
                    <RotateCcw className="w-4 h-4" />
                    Limpiar
                </button>
            </div>

            {/* Step 1: Carga de Insumos */}
            <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl overflow-hidden shadow-md mb-6">
                <div className="p-4 sm:p-5 border-b border-[#f1f5f9] flex items-center gap-3 bg-slate-50">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1a5276] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        1
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[#102129]">Carga de Insumos</h2>
                </div>

                <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
                        {/* Left Side: Upload Controls */}
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

                        {/* Right Side: Selected Documents & External Refs */}
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
                                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-xl text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] bg-slate-50 min-h-[80px] transition-all"
                                    placeholder="Pega aquí URLs o bibliografía adicional..."
                                    value={formData.externalReferences}
                                    onChange={(e) => setFormData({ ...formData, externalReferences: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col gap-2">
                            <div className="flex items-center justify-between text-red-800 text-sm font-semibold">
                                <span className="flex items-center gap-2">
                                    <RotateCcw className="w-4 h-4" />
                                    Ocurrió un error
                                </span>
                                <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-lg transition-colors">✕</button>
                            </div>
                            <p className="text-xs text-red-600 leading-relaxed font-medium">
                                {error}
                            </p>
                            {error.includes("cuota") && (
                                <div className="mt-1 text-[10px] text-red-500 italic bg-white/50 p-2 rounded border border-red-100">
                                    Sugerencia: Prueba cambiando el modelo a "Gemini Flash (Estable)" o espera 60 segundos antes de reintentar.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Step 2: Parámetros Académicos */}
            <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl p-6 sm:p-8 mb-6 shadow-md">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1a5276] text-white flex items-center justify-center text-sm sm:text-base font-semibold flex-shrink-0">
                        2
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">
                        Parámetros Académicos
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-5 gap-x-6 mb-6">
                    {/* Programa Educativo */}
                    <div className="lg:col-span-4">
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Programa Educativo
                        </label>
                        <div className="space-y-2">
                            <select
                                className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm text-[#64748b] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all"
                                value={availablePrograms.some(p => p.nombre === formData.program) ? formData.program : (formData.program ? "manual" : "")}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "manual") {
                                        setFormData({ 
                                            ...formData, 
                                            program: '', 
                                            program_id: null,
                                            subject: '',
                                            subject_id: null
                                        });
                                        setIsManualMode(true);
                                    } else {
                                        const prog = availablePrograms.find(p => p.nombre === val);
                                        setFormData({ 
                                            ...formData, 
                                            program: val, 
                                            program_id: prog?.id || null,
                                            subject: '',
                                            subject_id: null
                                        });
                                        setIsManualMode(val === IS_PROGRAM ? false : true);
                                    }
                                    setSelectedSemesterNum('');
                                }}
                                disabled={isLoadingPrograms}
                            >
                                <option value="">{isLoadingPrograms ? 'Cargando programas...' : 'Seleccionar programa...'}</option>
                                {availablePrograms.map(p => (
                                    <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                ))}
                                <option value="manual">Otro (Especificar manualmente)</option>
                            </select>

                            {(isManualMode || (formData.program && !availablePrograms.some(p => p.nombre === formData.program) && formData.program !== IS_PROGRAM)) && (
                                <input
                                    type="text"
                                    placeholder="Nombre del programa educativo"
                                    value={formData.program}
                                    onChange={(e) => setFormData({ ...formData, program: e.target.value, program_id: null })}
                                    className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all animate-in fade-in slide-in-from-top-1"
                                />
                            )}
                        </div>
                    </div>

                    {/* Semestre */}
                    <div className="lg:col-span-4">
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Semestre / Grado
                        </label>
                        <div className="relative">
                            {!isManualMode && isISProgram ? (
                                <select
                                    className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm text-[#64748b] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all"
                                    value={selectedSemesterNum}
                                    onChange={(e) => {
                                        const sem = e.target.value;
                                        setSelectedSemesterNum(sem);
                                        setFormData(prev => ({ ...prev, semester: sem ? `${sem}° Semestre` : '' }));
                                    }}
                                    disabled={isLoadingSemesters}
                                >
                                    <option value="">{isLoadingSemesters ? 'Cargando...' : 'Seleccionar semestre...'}</option>
                                    {availableSemesters.map(s => (
                                        <option key={s} value={s}>{s}° Semestre</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Ej. 5to Semestre"
                                    value={formData.semester}
                                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                    className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all"
                                />
                            )}
                            {isISProgram && (
                                <button 
                                    onClick={() => setIsManualMode(!isManualMode)}
                                    className="absolute right-0 -top-6 text-[10px] font-bold text-[#1a5276] hover:underline uppercase tracking-tighter"
                                >
                                    {isManualMode ? 'Usar catálogo' : 'Ingreso manual'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Materia / Asignatura */}
                    <div className="lg:col-span-4">
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Materia / Asignatura
                        </label>
                        {!isManualMode && isISProgram ? (
                            <select
                                className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm text-[#64748b] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all"
                                value={formData.subject}
                                onChange={(e) => {
                                    const subName = e.target.value;
                                    const sub = availableSubjects.find(s => s.nombre === subName);
                                    setFormData({ ...formData, subject: subName, subject_id: sub?.id || null });
                                }}
                                disabled={!selectedSemesterNum || isLoadingSubjects}
                            >
                                <option value="">
                                    {!selectedSemesterNum
                                        ? 'Primero selecciona un semestre'
                                        : isLoadingSubjects
                                            ? 'Cargando materias...'
                                            : 'Seleccionar materia...'}
                                </option>
                                {availableSubjects.map(s => (
                                    <option key={s.id} value={s.nombre}>{s.clave} — {s.nombre}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                placeholder="Ej. Programación Orientada a Objetos"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value, subject_id: null })}
                                className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                            />
                        )}
                    </div>

                    {/* Tema Principal */}
                    <div className="lg:col-span-6">
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Tema Principal
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Herencia"
                            value={formData.topic}
                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                        />
                    </div>

                    {/* Subtema (Opcional) */}
                    <div className="lg:col-span-6">
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Subtema (Opcional)
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Herencia simple"
                            value={formData.subtopic}
                            onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                        />
                    </div>

                    {/* Objetivos de Aprendizaje */}
                    <div className="lg:col-span-12">
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Objetivos de Aprendizaje del Tema
                            <span className="ml-2 text-xs font-normal text-[#94a3b8]">(Opcional)</span>
                        </label>
                        <textarea
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] bg-slate-50 min-h-[90px] resize-y transition-all"
                            placeholder="Ej: El estudiante identificará las fases del ciclo de vida del software y justificará su orden lógico..."
                            value={formData.learningObjectives}
                            onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
                        />
                        <p className="mt-1 text-[11px] text-[#64748b] italic">
                            Las preguntas se alinearán a estos objetivos para medir exactamente lo que deseas evaluar.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-5 gap-x-6 mb-6">
                    {/* Nivel de Dificultad */}
                    <div>
                        <label className="block text-sm font-medium text-[#102129] mb-2">
                            Nivel de Dificultad
                        </label>
                        <select
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] bg-white transition-all"
                            value={formData.difficulty}
                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                        >
                            <option>Básico</option>
                            <option>Intermedio</option>
                            <option>Avanzado</option>
                        </select>
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
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] bg-white transition-all"
                        />
                    </div>
                </div>

                {/* Número de Preguntas por Tipo */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-[#102129] mb-3">
                        Número de Preguntas por Tipo
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="bg-slate-50 border border-[#e2e8f0]/80 rounded-xl p-3 sm:p-5 transition-all hover:border-[#1a5276]/30 hover:bg-slate-100/50 shadow-sm">
                            <label className="block text-[10px] sm:text-xs font-bold text-[#1a5276] uppercase tracking-wider mb-2">
                                Opción Múltiple
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={formData.numMCQ}
                                onChange={(e) => setFormData({ ...formData, numMCQ: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] text-center font-semibold text-slate-800 bg-white transition-all"
                            />
                            <p className="text-[9px] sm:text-[10px] text-[#94a3b8] mt-1.5 text-center">4 opciones, 1 correcta</p>
                        </div>
                        <div className="bg-slate-50 border border-[#e2e8f0]/80 rounded-xl p-3 sm:p-5 transition-all hover:border-[#1a5276]/30 hover:bg-slate-100/50 shadow-sm">
                            <label className="block text-[10px] sm:text-xs font-bold text-[#1a5276] uppercase tracking-wider mb-2">
                                Relacionar Columnas
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={formData.numMatching}
                                onChange={(e) => setFormData({ ...formData, numMatching: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] text-center font-semibold text-slate-800 bg-white transition-all"
                            />
                            <p className="text-[9px] sm:text-[10px] text-[#94a3b8] mt-1.5 text-center">4–6 pares de conceptos</p>
                        </div>
                        <div className="bg-slate-50 border border-[#e2e8f0]/80 rounded-xl p-3 sm:p-5 transition-all hover:border-[#1a5276]/30 hover:bg-slate-100/50 shadow-sm">
                            <label className="block text-[10px] sm:text-xs font-bold text-[#1a5276] uppercase tracking-wider mb-2">
                                Calculada
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={formData.numCalculated}
                                onChange={(e) => setFormData({ ...formData, numCalculated: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] text-center font-semibold text-slate-800 bg-white transition-all"
                            />
                            <p className="text-[9px] sm:text-[10px] text-[#94a3b8] mt-1.5 text-center">Problemas numéricos</p>
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-[#64748b]">
                        Total: <span className="font-semibold text-[#102129]">
                            {(parseInt(formData.numMCQ) || 0) + (parseInt(formData.numMatching) || 0) + (parseInt(formData.numCalculated) || 0)}
                        </span> preguntas · Escribe 0 para omitir un tipo.
                    </p>
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

                    <div className="mt-6">
                        <label className="block text-sm font-semibold text-[#102129] mb-3 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-[#1a5276]" />
                            Instrucciones Especiales (Opcional)
                        </label>
                        <textarea
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent bg-[#f8fafc] min-h-[100px] transition-all resize-y"
                            placeholder="Ej: 'Usa un tono formal y técnico', 'Todas las preguntas deben incluir ejemplos de la vida real', 'Enfócate en aspectos'..."
                            value={formData.customInstructions}
                            onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                        />
                        <p className="mt-2 text-[11px] text-[#64748b] leading-tight italic">
                            Estas reglas se sumarán a los estándares pedagógicos del sistema.
                        </p>
                    </div>
                </div>
            </div>

            {/* Step 3: Configuración de IA */}
            <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl p-6 sm:p-8 mb-6 shadow-md">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#1a5276] text-white flex items-center justify-center text-base font-semibold flex-shrink-0">
                        3
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">
                        Configuración de IA
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-[#102129] mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            Modelo de Inteligencia Artificial
                        </label>
                        <select
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all"
                            value={formData.aiModel}
                            onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                        >
                            <option value="gemini-flash-latest">Gemini Flash (Estable - Recomendado)</option>
                            <option value="gemma-3-27b-it">Gemma 3 27B (Modelo Abierto)</option>
                            <option value="gemini-3-flash-preview">Gemini 3 Flash (Vista Previa)</option>

                        </select>
                        <p className="mt-1.5 text-[11px] text-[#64748b]">
                            Seleccione el modelo según sus necesidades de rapidez o complejidad.
                        </p>
                    </div>
                    <div className="flex items-end flex-1">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, aiModel: 'gemini-flash-latest' })}
                            className="text-[10px] text-[#1a5276] hover:underline font-medium"
                        >
                            ¿Problemas con el modelo? Restablecer por defecto
                        </button>
                    </div>
                </div>

                {/* Tipo de Reactivo Principal */}
                {/* This section is removed as per the instruction */}
                {/*
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
                */}

                {/* Progress UI */}
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

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                    <button className="px-6 py-3 rounded-xl border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-slate-800 transition-all">
                        Guardar Borrador
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-[#1a5276] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#154360] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
            <ConfirmModal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                onConfirm={confirmClearAll}
                title="Limpiar Formulario"
                message="¿Estás seguro de que deseas limpiar todos los campos y borrar los archivos cargados? Esta acción no se puede deshacer."
                confirmText="Sí, limpiar todo"
                cancelText="Cancelar"
                danger={true}
            />
        </div>
    );
}
