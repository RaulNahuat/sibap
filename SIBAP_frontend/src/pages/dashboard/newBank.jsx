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
} from 'lucide-react';

export default function NewBankPage() {
    const navigate = useNavigate();
    const [selectedQuestionType, setSelectedQuestionType] = useState('multiple');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [formData, setFormData] = useState({
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

    const handleGenerate = async () => {
        // Validate form
        if (!formData.subject || !formData.topic) {
            alert('Por favor completa al menos la materia y el tema principal');
            return;
        }

        setIsGenerating(true);

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
                }
            });
        }, 2000);
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

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#102129] mb-2">
                    Nuevo Banco de Preguntas
                </h1>
                <p className="text-[15px] text-[#64748b]">
                    Completa los 3 pasos para que la Inteligencia Artificial genere tu examen automáticamente.
                </p>
            </div>

            {/* Step 1: Carga de Insumos */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-8 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#1a5276] text-white flex items-center justify-center text-base font-semibold flex-shrink-0">
                        1
                    </div>
                    <h2 className="text-lg font-semibold text-[#102129]">
                        Carga de Insumos
                    </h2>
                </div>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-[#cbd5e1] rounded-lg p-12 text-center hover:border-[#1a5276] hover:bg-[#f8fafc] transition-all">
                    <UploadCloud className="w-12 h-12 text-[#1a5276] mx-auto mb-4" />
                    <p className="text-base text-[#102129] font-medium mb-2">
                        Arrastra tus archivos aquí o haz clic para explorar
                    </p>
                    <p className="text-sm text-[#64748b] mb-4">
                        Soporta: PDF, DOCX, TXT (Máx. 10MB)
                    </p>

                    {uploadedFiles.length > 0 && (
                        <div className="mt-6 space-y-2">
                            {uploadedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between bg-[#f1f5f9] px-4 py-3 rounded-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-[#1a5276]" />
                                        <span className="text-sm text-[#102129]">{file.name}</span>
                                    </div>
                                    <button className="text-[#64748b] hover:text-red-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Referencias Externas */}
                <div className="mt-6">
                    <label className="block text-sm font-medium text-[#102129] mb-2">
                        Referencias Externas (Opcional)
                    </label>
                    <textarea
                        className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                        rows="3"
                        placeholder="Pega aquí URLs o bibliografía adicional..."
                        value={formData.externalReferences}
                        onChange={(e) => setFormData({ ...formData, externalReferences: e.target.value })}
                    />
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

            {/* Hint */}
            <div className="flex items-start gap-3 text-sm text-[#64748b] bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4">
                <CheckCircle className="w-5 h-5 text-[#27ae60] flex-shrink-0 mt-0.5" />
                <p>
                    La IA generará reactivos alineados a tu material y validados pedagógicamente.
                    Podrás revisarlos y editarlos antes de exportar.
                </p>
            </div>
        </div>
    );
}
