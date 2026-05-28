from pydantic import BaseModel
from typing import List, Optional
from schemas.payment_schema import PaymentResponse
from datetime import datetime

class ClientSimple(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class WorkerSimple(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

# 🔹 SCHEMA PARA CREAR UN TRABAJO (INPUT)
class JobCreate(BaseModel):
    description: str
    quantity: int
    unit_price: float
    client_id: int
    worker_id: int
    status: str = "pending"
    payment_method: Optional[str] = None


# 🔹 SCHEMA PARA RESPUESTA (OUTPUT)
class JobResponse(BaseModel):
    id: int
    description: str
    quantity: int
    unit_price: float
    total: float
    status: str
    created_at: datetime

    client: ClientSimple | None
    worker: WorkerSimple | None
    payments: List[PaymentResponse] = []

    class Config:
        from_attributes = True