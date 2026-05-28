from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# 🔹 Crear cliente
class ClientCreate(BaseModel):
    name: str
    phone: Optional[str] = None


# 🔹 Respuesta
class ClientResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True