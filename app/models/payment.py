from sqlalchemy import Column, Integer, ForeignKey, DECIMAL, Enum, TIMESTAMP
from sqlalchemy.sql import func
from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    method = Column(Enum("cash", "qr"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())