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
    question_type: QuestionType
    difficulty: DifficultyLevel
    num_questions: int = 10
    wrong_option_count: int = 3
    model_name: Optional[str] = "gemini-2.0-flash"
    plausible_distractors: bool = False
    avoid_ambiguity: bool = True
    custom_instructions: Optional[str] = None
    external_references: Optional[str] = None

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
