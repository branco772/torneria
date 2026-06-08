from sqlalchemy import Column, DECIMAL, Integer, String, TIMESTAMP
from sqlalchemy.sql import func
from app.core.database import Base


class EPPEvent(Base):
    __tablename__ = "epp_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False)
    severity = Column(String(20), default="medium")
    confidence = Column(DECIMAL(5, 2), nullable=True)
    image_path = Column(String(255), nullable=True)
    status = Column(String(30), default="open")
    created_at = Column(TIMESTAMP, server_default=func.now())
