from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.configuracion_generacion import QuestionType, DifficultyLevel

class OptionBase(BaseModel):
    option_text: str
    is_correct: bool

class OptionResponse(OptionBase):
    id: int

    class Config:
        from_attributes = True

class QuestionBase(BaseModel):
    question_text: str
    item_type: str
    difficulty: str

class QuestionResponse(QuestionBase):
    id: int
    is_validated: bool
    created_at: datetime
    opciones: List[OptionResponse]

    class Config:
        from_attributes = True

class QuestionGenerationRequest(BaseModel):
    document_ids: List[int]
    program: str
    semester: str
    subject: str
    topic: str
    subtopic: Optional[str] = None
    question_type: QuestionType
    difficulty: DifficultyLevel
    num_questions: int
    wrong_option_count: int = 3
    model_name: Optional[str] = None
    plausible_distractors: bool = False
    avoid_ambiguity: bool = True
    external_references: Optional[str] = None

class QuestionUpdateRequest(BaseModel):
    id: int
    questionText: Optional[str] = None
    validationStatus: Optional[str] = None
    answers: Optional[List[dict]] = None 

class BatchUpdateResponse(BaseModel):
    updated_count: int
    message: str

class QuestionGenerationResponse(BaseModel):
    config_id: int
    questions: List[QuestionResponse]
