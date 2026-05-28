from pydantic import BaseModel
from datetime import datetime
from typing import Literal


#Crear pago
class PaymentCreate(BaseModel):
    job_id: int
    amount: float
    method: Literal["cash", "qr"]


#Respuesta
class PaymentResponse(BaseModel):
    id: int
    job_id: int
    amount: float
    method: str
    created_at: datetime

    class Config:
        from_attributes = True