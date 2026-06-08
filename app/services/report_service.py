from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import date

from app.models.payment import Payment
from app.models.expense import Expense

from app.models.job import Job
from app.models.worker import Worker
from app.models.client import Client

HIDDEN_STATUS = "hidden"

def get_daily_report(db: Session, report_date: date):
    
    # 🔥 ingresos (pagos del día)
    income = db.query(func.sum(Payment.amount))\
        .join(Job, Payment.job_id == Job.id)\
        .filter(Job.visibility_status != HIDDEN_STATUS)\
        .filter(func.date(Payment.created_at) == report_date)\
        .scalar()

    income = float(income or 0)

    # 🔥 gastos del día
    expenses = db.query(func.sum(Expense.amount))\
        .filter(Expense.visibility_status != HIDDEN_STATUS)\
        .filter(func.date(Expense.created_at) == report_date)\
        .scalar()

    expenses = float(expenses or 0)

    # 🔥 ganancia neta
    profit = income - expenses

    return {
        "date": report_date,
        "income": income,
        "expenses": expenses,
        "profit": profit
    }
#ganancia por trabajador
def get_profit_by_worker(db: Session):

    results = db.query(
        Worker.id,
        Worker.name,

        # 🔥 total de TODOS los trabajos
        func.sum(Job.total).label("total_generated"),

        # 🔥 total SOLO pagados
        func.sum(
            case(
                (Job.status == "paid", Job.total),
                else_=0
            )
        ).label("total_paid"),

        # 🔥 cantidad de trabajos pagados
        func.sum(
            case(
                (Job.status == "paid", 1),
                else_=0
            )
        ).label("paid_jobs")

    ).join(Job, Job.worker_id == Worker.id)\
     .filter(
        Job.visibility_status != HIDDEN_STATUS,
        Worker.visibility_status != HIDDEN_STATUS
    )\
     .group_by(Worker.id, Worker.name)\
     .all()

    data = []

    for r in results:
        total_generated = float(r.total_generated or 0)
        total_paid = float(r.total_paid or 0)
        paid_jobs = int(r.paid_jobs or 0)

        profit = total_paid * 0.30  # 🔥 ganancia REAL

        data.append({
            "worker_id": r.id,
            "worker_name": r.name,
            "total_generated": total_generated,
            "total_paid": total_paid,
            "paid_jobs": paid_jobs,
            "profit": profit
        })

    return data

def get_report_by_range(db: Session, start_date: date, end_date: date):

    # 🔥 ingresos (pagos en rango)
    income = db.query(func.sum(Payment.amount))\
        .join(Job, Payment.job_id == Job.id)\
        .filter(Job.visibility_status != HIDDEN_STATUS)\
        .filter(func.date(Payment.created_at) >= start_date)\
        .filter(func.date(Payment.created_at) <= end_date)\
        .scalar()

    income = float(income or 0)

    # 🔥 gastos en rango
    expenses = db.query(func.sum(Expense.amount))\
        .filter(Expense.visibility_status != HIDDEN_STATUS)\
        .filter(func.date(Expense.created_at) >= start_date)\
        .filter(func.date(Expense.created_at) <= end_date)\
        .scalar()

    expenses = float(expenses or 0)

    # 🔥 ganancia
    profit = income - expenses

    return {
        "start_date": start_date,
        "end_date": end_date,
        "income": income,
        "expenses": expenses,
        "profit": profit
    }

def _date_range(query, model, start_date=None, end_date=None):
    if start_date:
        query = query.filter(func.date(model.created_at) >= start_date)
    if end_date:
        query = query.filter(func.date(model.created_at) <= end_date)
    return query

def get_reports_summary(db: Session, start_date=None, end_date=None, category=None):
    payments_query = _date_range(
        db.query(Payment).join(Job, Payment.job_id == Job.id).filter(Job.visibility_status != HIDDEN_STATUS),
        Payment,
        start_date,
        end_date
    )
    expenses_query = _date_range(
        db.query(Expense).filter(Expense.visibility_status != HIDDEN_STATUS),
        Expense,
        start_date,
        end_date
    )
    jobs_query = _date_range(
        db.query(Job).filter(Job.visibility_status != HIDDEN_STATUS),
        Job,
        start_date,
        end_date
    )

    if category and category != "all":
        expenses_query = expenses_query.filter(Expense.category == category)

    income = float(payments_query.with_entities(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0)
    expenses = float(expenses_query.with_entities(func.coalesce(func.sum(Expense.amount), 0)).scalar() or 0)
    completed_jobs = int(jobs_query.filter(Job.status == "paid").count() or 0)
    total_jobs_amount = float(jobs_query.with_entities(func.coalesce(func.sum(Job.total), 0)).scalar() or 0)
    total_jobs_count = int(jobs_query.count() or 0)

    top_category = expenses_query.with_entities(
        Expense.category,
        func.coalesce(func.sum(Expense.amount), 0).label("total")
    ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).first()

    return {
        "total_income": income,
        "total_expenses": expenses,
        "net_profit": income - expenses,
        "jobs_completed": completed_jobs,
        "average_job_value": total_jobs_amount / total_jobs_count if total_jobs_count else 0,
        "most_used_expense_category": {
            "category": top_category.category if top_category else None,
            "total": float(top_category.total) if top_category else 0
        }
    }

def get_reports_monthly(db: Session, year: int):
    data = []

    for month in range(1, 13):
        income = db.query(func.coalesce(func.sum(Payment.amount), 0))\
            .join(Job, Payment.job_id == Job.id)\
            .filter(Job.visibility_status != HIDDEN_STATUS)\
            .filter(func.extract("year", Payment.created_at) == year)\
            .filter(func.extract("month", Payment.created_at) == month)\
            .scalar() or 0

        expenses = db.query(func.coalesce(func.sum(Expense.amount), 0))\
            .filter(Expense.visibility_status != HIDDEN_STATUS)\
            .filter(func.extract("year", Expense.created_at) == year)\
            .filter(func.extract("month", Expense.created_at) == month)\
            .scalar() or 0

        income = float(income)
        expenses = float(expenses)

        data.append({
            "month": month,
            "income": income,
            "expenses": expenses,
            "profit": income - expenses
        })

    return data

def get_reports_expenses_by_category(db: Session, start_date=None, end_date=None):
    query = _date_range(
        db.query(Expense).filter(Expense.visibility_status != HIDDEN_STATUS),
        Expense,
        start_date,
        end_date
    )

    rows = query.with_entities(
        Expense.category,
        func.coalesce(func.sum(Expense.amount), 0).label("total")
    ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).all()

    return [{"category": row.category, "total": float(row.total)} for row in rows]

def get_reports_profit(db: Session, start_date=None, end_date=None):
    summary = get_reports_summary(db, start_date, end_date)

    return {
        "income": summary["total_income"],
        "expenses": summary["total_expenses"],
        "profit": summary["net_profit"],
        "margin": (summary["net_profit"] / summary["total_income"] * 100)
        if summary["total_income"] else 0
    }

def get_reports_top_jobs(db: Session, start_date=None, end_date=None, limit: int = 10):
    jobs_query = _date_range(
        db.query(Job)
        .join(Client, Job.client_id == Client.id)
        .filter(Job.visibility_status != HIDDEN_STATUS, Client.visibility_status != HIDDEN_STATUS),
        Job,
        start_date,
        end_date
    )

    jobs = jobs_query.order_by(Job.total.desc()).limit(limit).all()

    data = []

    for job in jobs:
        job_expenses = float(
            _date_range(
                db.query(Expense).filter(Expense.visibility_status != HIDDEN_STATUS),
                Expense,
                start_date,
                end_date
            )
            .filter(Expense.job_id == job.id)
            .with_entities(func.coalesce(func.sum(Expense.amount), 0))
            .scalar() or 0
        )
        income = float(job.total or 0)

        data.append({
            "job": job.description,
            "client": job.client.name if job.client else "-",
            "income": income,
            "expenses": job_expenses,
            "profit": income - job_expenses
        })

    return data
