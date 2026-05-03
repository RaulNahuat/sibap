from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.configuracion_generacion import QuestionType, DifficultyLevel

class OptionBase(BaseModel):
    option_text: str
    is_correct: bool
    feedback: Optional[str] = None

class OptionResponse(OptionBase):
    id: int

    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    question_text: str
    name: Optional[str] = None
    feedback_correct: Optional[str] = None
    feedback_incorrect: Optional[str] = None

class QuestionResponse(QuestionBase):
    id: int
    is_validated: bool
    created_at: datetime
    question_type: Optional[QuestionType] = None
    opciones: List[OptionResponse]

    class Config:
        from_attributes = True

class QuestionGenerationRequest(BaseModel):
    document_ids: List[int]
    program_id: Optional[int] = None
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    program: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    subtopic: Optional[str] = None
    semester: Optional[str] = None
    learning_objectives: Optional[str] = None
    general_competence: Optional[str] = None
    specific_competence: Optional[str] = None
    cognitive_level: Optional[str] = "Comprender"
    question_type: Optional[QuestionType] = QuestionType.MIXED
    difficulty: DifficultyLevel
    num_questions: int = 10
    num_mcq: int = 0
    num_matching: int = 0
    num_calculated: int = 0
    wrong_option_count: int = 3
    model_name: Optional[str] = "gemini-2.0-flash"
    plausible_distractors: bool = False
    avoid_ambiguity: bool = True
    generate_general_feedback: bool = True
    generate_specific_feedback: bool = True
    custom_instructions: Optional[str] = None
    external_references: Optional[str] = None
    custom_prompt: Optional[str] = None

class QuestionUpdateRequest(BaseModel):
    id: int
    name: Optional[str] = None
    questionText: Optional[str] = None
    validationStatus: Optional[str] = None
    feedback_correct: Optional[str] = None
    feedback_incorrect: Optional[str] = None
    answers: Optional[List[dict]] = None 

class ManualOptionRequest(BaseModel):
    text: str
    is_correct: bool
    feedback: Optional[str] = None

class ManualQuestionRequest(BaseModel):
    question_text: str
    options: List[ManualOptionRequest]

class BatchUpdateResponse(BaseModel):
    updated_count: int
    message: str

class QuestionGenerationResponse(BaseModel):
    config_id: int
    questions: List[QuestionResponse]

class QuestionStatusResponse(BaseModel):
    config_id: int
    status: str
    question_count: int
    total_requested: int
    error_message: Optional[str] = None
