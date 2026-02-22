from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RecentActivityItem(BaseModel):
    id: int
    name: str  
    subject: str
    date: datetime
    reactives_count: int
    status: str 
    validated_percentage: float 

class BankListItem(BaseModel):
    id: int
    name: str
    subject: str
    difficulty: str
    created_at: datetime
    totalQuestions: int
    validatedQuestions: int
    isCompleted: bool
    progressPercentage: float

class DashboardStats(BaseModel):
    total_banks: int
    total_reactivos: int
    validated_percentage: float
    pending_banks: int
    recent_activity: List[RecentActivityItem]
