from sqlalchemy import Column, Integer, String, ForeignKey, DECIMAL, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)

    description = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(10,2), nullable=False)
    total = Column(DECIMAL(10,2), nullable=False)

    client_id = Column(Integer, ForeignKey("clients.id"))
    worker_id = Column(Integer, ForeignKey("workers.id"))

    status = Column(String(20), default="pending")

    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relaciones 🔥
    client = relationship("Client")
    worker = relationship("Worker")

    payments = relationship(
    "Payment",
    backref="job",
    cascade="all, delete-orphan"
)