import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import DocumentSelectionModal from '../../components/documents/DocumentSelectionModal';
import { useLocalStorage } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../context/ToastContext';

//Hooks
import { useCurriculum } from '../../hooks/newBank/useCurriculum';
import { useDocumentManager } from '../../hooks/newBank/useDocumentManager';
import { useQuestionGenerator } from '../../hooks/newBank/useQuestionGenerator';

//Componentes para los pasos de la página
import Step1Documents from '../../components/newBank/Step1Documents';
import Step2AcademicParams from '../../components/newBank/Step2AcademicParams';
import Step3AIConfig from '../../components/newBank/Step3AIConfig';
import PromptPreviewModal from '../../components/newBank/PromptPreviewModal';
import { getAIModels } from '../../api/config';

export default function NewBankPage() {
    const location = useLocation();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [showClearModal, setShowClearModal] = useState(false);

    const formKey = user?.id ? `sibap_newbank_form_${user.id}` : 'sibap_newbank_form';

    const [formData, setFormData, clearFormData] = useLocalStorage(formKey, {
        program: '',
        program_id: null,
        semester: '',
        subject: '',
        subject_id: null,
        topic: '',
        subtopic: '',
        learningObjectives: '',
        generalCompetence: '',
        specificCompetence: '',
        cognitiveLevel: ['Comprender'],
        numMCQ: 5,
        numMatching: 2,
        numCalculated: 1,
        wrongOptionCount: 3,
        plausibleDistractors: true,
        avoidAmbiguity: true,
        customInstructions: '',
        externalReferences: '',
        aiModel: 'gemini-flash-latest',
        generateGeneralFeedback: true,
        generateSpecificFeedback: true,
        keywords: [],
    });

    const [showAdvancedAcademic, setShowAdvancedAcademic] = useState(false);
    const [showPromptModal, setShowPromptModal] = useState(false);
    
    //Estados para el Prompt (centralizados)
    const [isPromptEdited, setIsPromptEdited] = useState(false);
    const [previewPromptText, setPreviewPromptText] = useState('');
    const [aiModels, setAiModels] = useState([]);

    //Carga de modelos de IA desde el backend
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const models = await getAIModels();
                setAiModels(models);
                
                //Si el modelo actual no está en la lista (posible cambio de backend), 
                //poner el por defecto
                const currentModelExists = models.some(m => m.id === formData.aiModel);
                if (models.length > 0 && !currentModelExists) {
                    const defaultModel = models.find(m => m.is_default) || models[0];
                    setFormData(prev => ({ ...prev, aiModel: defaultModel.id }));
                }
            } catch (err) {
                console.error("Error al cargar modelos de IA:", err);
            }
        };
        fetchModels();
    }, []);

    //Hook de Documentos
    const {
        uploadedFiles,
        setUploadedFiles,
        clearUploadedFiles,
        isUploading,
        showLibraryModal,
        setShowLibraryModal,
        error: docError,
        setError: setDocError,
        handleFileUpload,
        handleLibrarySelect,
        removeFile
    } = useDocumentManager(user);

    //Hook de Plan de Estudios
    const {
        IS_PROGRAM,
        isISProgram,
        availablePrograms,
        availableSemesters,
        availableSubjects,
        selectedSemesterNum,
        setSelectedSemesterNum,
        isLoadingPrograms,
        isLoadingSemesters,
        isLoadingSubjects,
        isManualMode,
        setIsManualMode
    } = useCurriculum(formData, setFormData);

    //Hook de Generación de Preguntas
    const {
        isGenerating,
        statusMessage,
        progress,
        error: genError,
        setError: setGenError,
        handleGenerate
    } = useQuestionGenerator({
        formData,
        uploadedFiles,
        clearFormData,
        clearUploadedFiles,
        setIsPromptEdited,
        setPreviewPromptText
    });

    // Manejar el estado entrante con documentos seleccionados
    useEffect(() => {
        const state = location.state;
        if (state?.selectedDocuments && state.selectedDocuments.length > 0) {
            handleLibrarySelect(state.selectedDocuments);
            //Limpiar el estado para evitar recargas infinitas si el usuario navega de nuevo
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleClearAll = () => {
        setShowClearModal(true);
    };

    const confirmClearAll = () => {
        clearFormData();
        clearUploadedFiles();
        setShowClearModal(false);
    };

    const handlePreviewPrompt = () => {
        if (!formData.subject || !formData.topic) {
            const msg = 'Por favor completa al menos la materia y el tema principal para previsualizar el prompt';
            showToast(msg, 'error');
            return;
        }

        if (uploadedFiles.length === 0 && !formData.externalReferences) {
            const msg = 'Por favor carga al menos un documento o proporciona referencias externas para que el prompt tenga contexto';
            showToast(msg, 'error');
            return;
        }

        setShowPromptModal(true);
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

            {/* Paso 1: Documentos */}
            <Step1Documents
                uploadedFiles={uploadedFiles}
                isUploading={isUploading}
                handleFileUpload={handleFileUpload}
                setShowLibraryModal={setShowLibraryModal}
                setUploadedFiles={setUploadedFiles}
                removeFile={removeFile}
                formData={formData}
                setFormData={setFormData}
            />

            {/* Paso 2: Parámetros Académicos */}
            <Step2AcademicParams
                formData={formData}
                setFormData={setFormData}
                availablePrograms={availablePrograms}
                availableSemesters={availableSemesters}
                availableSubjects={availableSubjects}
                isLoadingPrograms={isLoadingPrograms}
                isLoadingSemesters={isLoadingSemesters}
                isLoadingSubjects={isLoadingSubjects}
                isManualMode={isManualMode}
                setIsManualMode={setIsManualMode}
                isISProgram={isISProgram}
                selectedSemesterNum={selectedSemesterNum}
                setSelectedSemesterNum={setSelectedSemesterNum}
                showAdvancedAcademic={showAdvancedAcademic}
                setShowAdvancedAcademic={setShowAdvancedAcademic}
            />

            {/* Paso 3: Configuración de IA */}
            <Step3AIConfig
                formData={formData}
                setFormData={setFormData}
                isGenerating={isGenerating}
                statusMessage={statusMessage}
                progress={progress}
                handlePreviewPrompt={handlePreviewPrompt}
                handleGenerate={handleGenerate}
                clearFormData={clearFormData}
                clearUploadedFiles={clearUploadedFiles}
                setIsPromptEdited={setIsPromptEdited}
                setPreviewPromptText={setPreviewPromptText}
                aiModels={aiModels}
            />

            {/* Modales */}
            <PromptPreviewModal
                showPromptModal={showPromptModal}
                setShowPromptModal={setShowPromptModal}
                formData={formData}
                uploadedFiles={uploadedFiles}
                handleGenerate={handleGenerate}
                isPromptEdited={isPromptEdited}
                setIsPromptEdited={setIsPromptEdited}
                previewPromptText={previewPromptText}
                setPreviewPromptText={setPreviewPromptText}
            />

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
