from pydantic import BaseModel
from datetime import date


class DailyReportResponse(BaseModel):
    date: date
    income: float
    expenses: float
    profit: float

class WorkerProfitResponse(BaseModel):
    worker_id: int
    worker_name: str
    total_generated: float
    total_paid: float
    paid_jobs: int
    profit: float

class RangeReportResponse(BaseModel):
    start_date: date
    end_date: date
    income: float
    expenses: float
    profit: float