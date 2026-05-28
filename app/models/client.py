from sqlalchemy import Column, Integer, String, TIMESTAMP
from sqlalchemy.sql import func
from core.database import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20))
    created_at = Column(TIMESTAMP, server_default=func.now())