from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.job import Job
from models.expense import Expense
from models.payment import Payment
from models.client import Client
from models.worker import Worker

from core.deps import get_db
from schemas.dashboard_schema import DashboardResponse
from services.dashboard_service import get_dashboard, get_income_by_day, get_top_debtors, get_alerts, get_expenses_by_category
from core.security import get_current_user
from typing import Optional

router = APIRouter(dependencies=[Depends(get_current_user)])
from services.ml_service import predict_income


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return get_dashboard(db, month, year)

@router.get("/dashboard/income-by-day")
def income_by_day(
    month: int = None,
    year: int = None,
    db: Session = Depends(get_db)
):
    return get_income_by_day(db, month, year)

@router.get("/dashboard/predict")
def predict_income_endpoint(db: Session = Depends(get_db)):

    prediction = predict_income(db)

    if prediction is None:
        return {
            "prediction": None,
            "message": "No hay suficientes datos"
        }

    return {
        "prediction": round(prediction, 2)
    }


@router.get("/dashboard/summary")
def get_summary(db: Session = Depends(get_db)):

    # 💰 Ingresos reales (pagos)
    total_income = db.query(func.sum(Payment.amount)).scalar() or 0

    # 💸 Gastos
    total_expenses = db.query(func.sum(Expense.amount)).scalar() or 0

    # 💵 Ganancia real
    profit = total_income - total_expenses

    # 📊 Pendiente (solo trabajos pendientes)
    pending = (
        db.query(func.sum(Job.total))
        .filter(Job.status == "pending")
        .scalar() or 0
    )

    return {
        "income": total_income,
        "expenses": total_expenses,
        "profit": profit,
        "pending": pending
    }

@router.get("/dashboard/debtors")
def get_debtors(db: Session = Depends(get_db)):
    return get_top_debtors(db)

@router.get("/dashboard/alerts")
def dashboard_alerts(db: Session = Depends(get_db)):
    return get_alerts(db)

@router.get("/dashboard/expenses-by-category")
def expenses_by_category(
    month: int = None,
    year: int = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total")
    )

    if month and year:
        query = query.filter(
            func.extract("month", Expense.created_at) == month,
            func.extract("year", Expense.created_at) == year
        )

    results = query.group_by(Expense.category).all()

    return [
        {"category": r.category, "total": float(r.total)}
        for r in results
    ]

@router.get("/dashboard/top-clients")
def top_clients(
    month: int = None,
    year: int = None,
    db: Session = Depends(get_db)
):

    query = (
        db.query(
            Client.name,
            func.sum(Job.total).label("total")
        )
        .join(Job, Job.client_id == Client.id)
    )

    if month and year:
        query = query.filter(
            func.extract("month", Job.created_at) == month,
            func.extract("year", Job.created_at) == year
        )

    results = (
        query.group_by(Client.id)
        .order_by(func.sum(Job.total).desc())
        .limit(5)
        .all()
    )

    return [{"name": r.name, "total": float(r.total)} for r in results]

@router.get("/dashboard/top-workers")
def top_workers(
    month: int = None,
    year: int = None,
    db: Session = Depends(get_db)
):

    query = (
        db.query(
            Worker.name,
            func.sum(Job.total).label("total")
        )
        .join(Job, Job.worker_id == Worker.id)
    )

    if month and year:
        query = query.filter(
            func.extract("month", Job.created_at) == month,
            func.extract("year", Job.created_at) == year
        )

    results = (
        query.group_by(Worker.id)
        .order_by(func.sum(Job.total).desc())
        .limit(5)
        .all()
    )

    return [{"name": r.name, "total": float(r.total)} for r in results]