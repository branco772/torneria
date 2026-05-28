from sqlalchemy import Column, ForeignKey, Integer, String, DECIMAL, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String(255), nullable=False)

    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(DECIMAL(10, 2), nullable=False)

    amount = Column(DECIMAL(10, 2), nullable=False)  # TOTAL
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now())
    category = Column(String(50), default="otros")
    job = relationship("Job")
