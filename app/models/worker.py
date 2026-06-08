from sqlalchemy import Column, Integer, String, TIMESTAMP
from sqlalchemy.sql import func
from app.core.database import Base

class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    visibility_status = Column(String(20), default="active", nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
