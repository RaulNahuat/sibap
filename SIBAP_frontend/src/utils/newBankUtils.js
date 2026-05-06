/**
 * Utilidades para el flujo de creación de nuevos bancos de preguntas
 */

/**
 * Mapea los datos del formulario al formato esperado por la API de generación de reactivos
 */
export const mapFormDataToRequest = (formData, uploadedFiles, customPrompt = null, isPromptEdited = false, previewPromptText = '') => {
    const difficultyMapping = {
        'Básico': 'EASY',
        'Intermedio': 'MEDIUM',
        'Avanzado': 'HARD'
    };

    const num_mcq = parseInt(formData.numMCQ) || 0;
    const num_matching = parseInt(formData.numMatching) || 0;
    const num_calculated = parseInt(formData.numCalculated) || 0;

    return {
        document_ids: uploadedFiles.map(f => f.id),
        program_id: formData.program_id,
        subject_id: formData.subject_id,
        program: formData.program,
        semester: formData.semester || null,
        subject: formData.subject,
        topic: formData.topic,
        subtopic: formData.subtopic || null,
        learning_objectives: formData.learningObjectives || null,
        general_competence: formData.generalCompetence || null,
        specific_competence: formData.specificCompetence || null,
        cognitive_level: Array.isArray(formData.cognitiveLevel) 
            ? formData.cognitiveLevel.join(', ') 
            : formData.cognitiveLevel,
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
        generate_general_feedback: formData.generateGeneralFeedback,
        generate_specific_feedback: formData.generateSpecificFeedback,
        custom_instructions: formData.customInstructions || null,
        external_references: formData.externalReferences || null,
        custom_prompt: customPrompt || (isPromptEdited ? previewPromptText : null)
    };
};
