from pydantic import BaseModel


class JobsStatus(BaseModel):
    pending: int
    credit: int
    paid: int


class DashboardResponse(BaseModel):
    income: float
    expenses_today: float
    expenses_month: float
    profit: float
    pending: float
    jobs: JobsStatus