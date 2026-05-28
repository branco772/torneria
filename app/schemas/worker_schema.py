from pydantic import BaseModel
from datetime import datetime


# 🔹 Crear trabajador
class WorkerCreate(BaseModel):
    name: str


# 🔹 Respuesta
class WorkerResponse(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True