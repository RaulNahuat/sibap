import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateQuestions, checkGenerationStatus, getBankQuestions } from '../../api/questions';
import { getErrorMessage } from '../../utils/errorHandler';
import { mapFormDataToRequest } from '../../utils/newBankUtils';
import { useToast } from '../../context/ToastContext';

export const useQuestionGenerator = ({
    formData,
    uploadedFiles,
    clearFormData,
    clearUploadedFiles,
    setIsPromptEdited,
    setPreviewPromptText
}) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const handleGenerate = async (customPrompt = null, isPromptEdited = false, previewPromptText = '') => {
        if (!formData.subject || !formData.topic) {
            showToast('Por favor completa al menos la materia y el tema principal', 'error');
            return;
        }

        if (uploadedFiles.length === 0 && !formData.externalReferences) {
            showToast('Por favor carga al menos un documento o proporciona referencias externas', 'error');
            return;
        }

        setIsGenerating(true);
        setStatusMessage('Iniciando generación...');
        setProgress({ current: 0, total: 0 });

        try {
            const requestData = mapFormDataToRequest(
                formData, 
                uploadedFiles, 
                customPrompt, 
                isPromptEdited, 
                previewPromptText
            );

            if (requestData.num_questions === 0) {
                showToast('Debes especificar al menos 1 pregunta en cualquier tipo', 'error');
                setIsGenerating(false);
                return;
            }

            const initialResponse = await generateQuestions(requestData);
            const { config_id } = initialResponse;

            const startTime = Date.now();
            const MAX_POLLING_TIME = 3 * 60 * 1000;

            const pollStatus = async () => {
                try {
                    if (Date.now() - startTime > MAX_POLLING_TIME) {
                        throw new Error('Tiempo de espera agotado después de 3 minutos. Revisa el Banco de Preguntas más tarde.');
                    }

                    const statusData = await checkGenerationStatus(config_id);
                    const { status, question_count, total_requested, error_message } = statusData;

                    setProgress({ current: question_count, total: total_requested });

                    if (status === 'COMPLETED') {
                        const finalQuestions = await getBankQuestions(config_id);
                        handleSuccessfulGeneration(finalQuestions, config_id, requestData);
                    } else if (status === 'FAILED') {
                        throw new Error(error_message || 'La IA falló al generar las preguntas.');
                    } else {
                        setStatusMessage(`Generando preguntas (${question_count}/${total_requested})...`);
                        setTimeout(pollStatus, 3000);
                    }
                } catch (err) {
                    const msg = getErrorMessage(err);
                    showToast(msg, 'error');
                    setIsGenerating(false);
                }
            };

            pollStatus();

        } catch (err) {
            const msg = getErrorMessage(err);
            showToast(msg, 'error');
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

        clearFormData();
        clearUploadedFiles();
        if (setIsPromptEdited) setIsPromptEdited(false);
        if (setPreviewPromptText) setPreviewPromptText('');

        navigate('/dashboard/validate', {
            state: {
                name: `${formData.subject} - ${formData.topic}`,
                subject: formData.subject,
                topic: formData.topic,
                cognitive_level: formData.cognitiveLevel,
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

    return {
        isGenerating,
        statusMessage,
        progress,
        handleGenerate
    };
};
