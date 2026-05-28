from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ExpenseJobSimple(BaseModel):
    id: int
    description: str

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    description: str
    quantity: int
    unit_price: float
    category: str = "otros"
    job_id: Optional[int] = None


class ExpenseResponse(BaseModel):
    id: int
    description: str
    quantity: int
    unit_price: float
    amount: float
    category: str
    job_id: Optional[int] = None
    job: Optional[ExpenseJobSimple] = None
    created_at: datetime

    class Config:
        from_attributes = True
