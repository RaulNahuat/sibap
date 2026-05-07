from typing import List, Optional
from app.schemas.question import QuestionGenerationRequest
from app.models.configuracion_generacion import QuestionType

class PromptBuilderService:
    _TYPE_LABELS = {
        QuestionType.MCQ: "Opción Múltiple (MCQ)",
        QuestionType.MATCHING: "Relacionar Columnas (MATCHING)",
        QuestionType.CALCULATED: "Calculada (CALCULATED)",
    }

    _TYPE_FROM_STR = {
        "mcq": QuestionType.MCQ,
        "matching": QuestionType.MATCHING,
        "calculated": QuestionType.CALCULATED,
    }

    _TYPE_INSTRUCTIONS = {
        QuestionType.MCQ: "- Genera 1 opción correcta y distractores plausibles.\n- Las opciones deben ser de longitud similar.\n- Asegúrate de que 'is_correct' sea true solo en la correcta.",
        QuestionType.MATCHING: "- Utiliza el formato 'Descripción | Término corto'.\n- Todos los elementos deben ser verdaderos (is_correct: true).",
        QuestionType.CALCULATED: "- Incluye la fórmula utilizada en la retroalimentación.\n- Usa datos numéricos realistas."
    }

    @staticmethod
    def get_type_label(q_type: QuestionType) -> str:
        return PromptBuilderService._TYPE_LABELS.get(q_type, "Opción Múltiple (MCQ)")

    @staticmethod
    def get_type_from_str(type_str: str) -> QuestionType:
        return PromptBuilderService._TYPE_FROM_STR.get(type_str.lower(), QuestionType.MCQ)

    @staticmethod
    def get_type_instructions(q_type: QuestionType) -> str:
        return PromptBuilderService._TYPE_INSTRUCTIONS.get(q_type, PromptBuilderService._TYPE_INSTRUCTIONS[QuestionType.MCQ])

    @staticmethod
    def build_unified_prompt(
        request: QuestionGenerationRequest,
        existing_formatted: str,
        context: str,
        custom_rules: str,
        distractor_rule: str,
        ambiguity_rule: str,
        gen_feedback_rule: str,
        spec_feedback_rule: str,
    ) -> str:
        # Secciones opcionales
        semester_line   = f"  • Semestre / Grado  : {request.semester}" if getattr(request, 'semester', None) else ""
        subtopic_line   = f"  • Subtema            : {request.subtopic}" if request.subtopic else ""
        keywords_line   = f"  • Términos Clave   : {', '.join(request.keywords)}" if getattr(request, 'keywords', None) else ""
        bloom_line      = f"  • Niveles de Bloom   : {request.cognitive_level}" if getattr(request, 'cognitive_level', None) else ""

        gen_comp_line   = f"\n  • Competencia General: {request.general_competence}" if getattr(request, 'general_competence', None) else ""
        spec_comp_line  = f"\n  • Comp. Específica   : {request.specific_competence}" if getattr(request, 'specific_competence', None) else ""
        obj_line        = f"\n  • Resultados de aprendizaje:\n    {request.learning_objectives}" if request.learning_objectives else ""
        ext_refs        = f"\n## REFERENCIAS EXTERNAS\n{request.external_references}" if getattr(request, 'external_references', None) else ""
        custom_block    = f"\n## INSTRUCCIONES DEL DOCENTE (PRIORIDAD ALTA)\n{custom_rules.strip()}" if custom_rules.strip() else ""

        # Construye la sección de distribución y reglas solo para los tipos solicitados
        dist_lines = []
        rules_sections = []
        total = 0
        if request.num_mcq > 0:
            dist_lines.append(f"  - Opción Múltiple (MCQ)     : {request.num_mcq} reactivo(s), {request.wrong_option_count} distractor(es) por pregunta")
            rules_sections.append(f"""\
### MCQ — Opción Múltiple ({request.num_mcq} reactivos)
- Enunciado: pregunta o situación concreta y evaluable.
- Genera 1 opción correcta y {request.wrong_option_count} distractores por reactivo.
- Opciones breves, homógeneas en extensión y sintácticamente paralelas.
- "is_correct": true EXCLUSIVAMENTE en la opción correcta.""")
            total += request.num_mcq
        if request.num_matching > 0:
            dist_lines.append(f"  - Relacionar Columnas (MATCHING): {request.num_matching} reactivo(s)")
            rules_sections.append(f"""\
### MATCHING — Relacionar Columnas ({request.num_matching} reactivos)
- Formato obligatorio de cada opción: "Descripción larga | Término corto" (máx. 4 palabras a la derecha).
- Genera entre 4 y 6 pares; todos son correctos (is_correct: true).
- Los pares deben ser inequívocos y extraíbles directamente del contenido.""")
            total += request.num_matching
        if request.num_calculated > 0:
            dist_lines.append(f"  - Calculada (CALCULATED)       : {request.num_calculated} reactivo(s)")
            rules_sections.append(f"""\
### CALCULATED — Preguntas Calculadas ({request.num_calculated} reactivos)
- Enunciado: problema numérico o cuantitativo con datos concretos.
- Genera 1 opción correcta y {request.wrong_option_count} distractores plausibles pero incorrectos.
- Incluye la fórmula o procedimiento completo en el feedback de la opción correcta.
- FORMATO MATEMÁTICO: usa $...$ exclusivamente para fórmulas. NUNCA \\( \\) \\[ \\].""")
            total += request.num_calculated

        distribution = "\n".join(dist_lines)
        rules = "\n\n".join(rules_sections)

        return f"""\
# ROL
Eres un experto pedagogo universitario especializado en diseño de evaluaciones de alta calidad.
Genera reactivos rigurosos, imparciales y alineados a los estándares académicos indicados.

# CONTEXTO ACADÉMICO
  • Programa : {request.program or "No especificado"}
{semester_line}
  • Materia  : {request.subject or "No especificada"}
  • Tema     : {request.topic or "No especificado"}
{subtopic_line}
{keywords_line}
{bloom_line}
{gen_comp_line}
{spec_comp_line}
{obj_line}
{custom_block}

# DISTRIBUCIÓN Y CANTIDAD
Genera exactamente {total} reactivos distribuidos así:
{distribution}

# RESTRICCIONES
  • NO repitas ni parafrasees ninguno de los enunciados existentes.
  • {distractor_rule}
  • {ambiguity_rule if ambiguity_rule else "Sin restricción adicional sobre ambigüedad."}
  • {gen_feedback_rule}
  • {spec_feedback_rule}
  • Cada reactivo debe cubrir un ángulo o concepto distinto (variedad pedagógica).

# PREGUNTAS YA EXISTENTES (NO REPETIR)
{existing_formatted}

# REGLAS POR TIPO
{rules}

# ESTÁNDARES TÉCNICOS
  1. LENGUAJE    : Gramáticamente perfecto, preciso y neutral.
  2. EQUIDAD     : Sin sesgos culturales, de género o socioeconómicos.
  3. DISTRACTORES: Plausibles pero inequívocamente incorrectos para quien domina el tema.
  4. VALIDEZ     : Evaluar únicamente contenido presente en el material de referencia.
  5. MATEMÁTICAS : Usa `$...$` SOLO para fórmulas (ej: `$E = mc^2$`).
                   Para montos usa palabras (ej: 50 000 pesos) o escapa `\\$`.

# CONTENIDO DE REFERENCIA
{context}
{ext_refs}

# FORMATO DE SALIDA
Devuelve EXCLUSIVAMENTE el siguiente JSON, sin texto adicional antes ni después:

{{
  "questions": [
    {{
      "type": "mcq",
      "name": "id_corto_descriptivo",
      "text": "Enunciado completo (admite HTML básico)",
      "feedback_correct": "Explicación de por qué la respuesta correcta lo es",
      "feedback_incorrect": "Orientación general para quien respondió mal",
      "options": [
        {{"text": "...", "is_correct": true, "feedback": "..."}},
        {{"text": "...", "is_correct": false, "feedback": "..."}}
      ]
    }}
  ]
}}

Nota: el campo \"type\" debe ser exactamente \"mcq\", \"matching\" o \"calculated\" según corresponda a cada reactivo.
"""

    @staticmethod
    def build_regeneration_prompt(
        q_type: QuestionType,
        question_text: str,
        siblings_formatted: str
    ) -> str:
        type_label = PromptBuilderService.get_type_label(q_type)
        type_instructions = PromptBuilderService.get_type_instructions(q_type)

        return f"""
    Regenera este reactivo de tipo {type_label} basándote en su contenido actual pero mejorando la claridad y precisión.
    
    PREGUNTA ACTUAL (A REGENERAR):
    {question_text}

    OTRAS PREGUNTAS EN EL MISMO EXAMEN (NO TE PAREZCAS A ESTAS):
    {siblings_formatted}

    REQUISITOS:
    - El enunciado debe ser sustancialmente mejorado.
    - NO debe ser académicamente similar ni repetitiva respecto a las 'OTRAS PREGUNTAS'.
    - Formato Matemático (CRÍTICO): Usa `$` SOLO para aislar fórmulas matemáticas (ej: `$E=mc^2$`). Para referirte a montos de dinero usa la palabra escrita o escápalo (`\\$50,000`). NUNCA encierres oraciones enteras dentro de signos `$`.
    
    {type_instructions}
    
    DEVOLVER ÚNICAMENTE UN JSON CON ESTA ESTRUCTURA:
    {{
        "text": "nuevo enunciado",
        "options": [
            {{"text": "opcion 1", "is_correct": true, "feedback": "feedback"}},
            {{"text": "opcion 2", "is_correct": false, "feedback": "feedback"}}
        ],
        "feedback_correct": "feedback general acierto",
        "feedback_incorrect": "feedback general error"
    }}
    """
