from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from models.payment import Payment
from models.expense import Expense
from models.job import Job
from models.client import Client
from datetime import datetime



def get_dashboard(db: Session, month: int = None, year: int = None):

    # 📅 Filtros por fecha
    job_query = db.query(Job)
    payment_query = db.query(Payment)
    expense_query = db.query(Expense)

    if month and year:
        job_query = job_query.filter(
            extract("month", Job.created_at) == month,
            extract("year", Job.created_at) == year
        )

        payment_query = payment_query.filter(
            extract("month", Payment.created_at) == month,
            extract("year", Payment.created_at) == year
        )

        expense_query = expense_query.filter(
            extract("month", Expense.created_at) == month,
            extract("year", Expense.created_at) == year
        )

    # 💰 Ingresos reales
    total_paid = payment_query.with_entities(func.sum(Payment.amount)).scalar() or 0

    # 📦 Total trabajos
    total_jobs = job_query.with_entities(func.sum(Job.total)).scalar() or 0

    # 💸 Gastos del mes
    total_expenses = expense_query.with_entities(func.sum(Expense.amount)).scalar() or 0

    # 📊 Pendiente por cobrar (🔥 FIX)
    pending_query = job_query.filter(Job.status == "pending")
    pending = pending_query.with_entities(
        func.sum(Job.total)
    ).scalar() or 0 

    # 📆 Gastos de hoy
    expenses_today = db.query(func.sum(Expense.amount)).filter(
        extract("day", Expense.created_at) == extract("day", func.now()),
        extract("month", Expense.created_at) == extract("month", func.now()),
        extract("year", Expense.created_at) == extract("year", func.now()),
    ).scalar() or 0

    # 📦 Estado de trabajos
    jobs_pending = db.query(func.count(Job.id)).filter(Job.status == "pending").scalar() or 0
    jobs_credit = db.query(func.count(Job.id)).filter(Job.status == "credit").scalar() or 0
    jobs_paid = db.query(func.count(Job.id)).filter(Job.status == "paid").scalar() or 0

    return {
        "income": total_paid,
        "expenses_today": expenses_today,
        "expenses_month": total_expenses,
        "profit": total_paid - total_expenses,
        "pending": pending,  # 🔥 ESTE ES EL QUE TE FALTABA
        "jobs": {
            "pending": jobs_pending,
            "credit": jobs_credit,
            "paid": jobs_paid
        }
    }


def get_income_by_day(db, month=None, year=None):

    today = datetime.today()

    # 🔥 valores por defecto
    if not month:
        month = today.month

    if not year:
        year = today.year

    # 🔥 query base
    query = db.query(
        func.date(Payment.created_at).label("date"),
        func.sum(Payment.amount).label("total")
    )

    # 🔥 filtro por mes/año
    query = query.filter(
        extract("month", Payment.created_at) == month,
        extract("year", Payment.created_at) == year
    )

    results = query.group_by(
        func.date(Payment.created_at)
    ).order_by(
        func.date(Payment.created_at)
    ).all()

    return [
        {
            "date": str(r.date),
            "total": float(r.total)
        }
        for r in results
    ]
def get_monthly_income(db):
    results = db.query(
        extract("year", Payment.created_at).label("year"),
        extract("month", Payment.created_at).label("month"),
        func.sum(Payment.amount).label("total")
    ).group_by(
        "year", "month"
    ).order_by(
        "year", "month"
    ).all()

    return [
        {
            "year": int(r.year),
            "month": int(r.month),
            "total": float(r.total)
        }
        for r in results
    ]

def get_top_debtors(db: Session):

    # 📦 Total por cliente
    jobs_sub = db.query(
        Job.client_id,
        func.sum(Job.total).label("total_jobs")
    ).group_by(Job.client_id).subquery()

    # 💰 Pagos por cliente
    payments_sub = db.query(
        Job.client_id,
        func.coalesce(func.sum(Payment.amount), 0).label("total_paid")
    ).join(Job, Payment.job_id == Job.id)\
     .group_by(Job.client_id).subquery()

    # 🔥 Unimos ambos
    results = db.query(
        Client.id,
        Client.name,
        jobs_sub.c.total_jobs,
        func.coalesce(payments_sub.c.total_paid, 0)
    )\
    .join(jobs_sub, jobs_sub.c.client_id == Client.id)\
    .outerjoin(payments_sub, payments_sub.c.client_id == Client.id)\
    .all()

    data = []

    for client_id, name, total_jobs, total_paid in results:
        debt = (total_jobs or 0) - (total_paid or 0)

        if debt > 0:
            data.append({
                "client_id": client_id,
                "client": name,
                "debt": float(debt)
            })

    data.sort(key=lambda x: x["debt"], reverse=True)

    return data

def get_alerts(db: Session):

    alerts = []

    # 🔴 1. CLIENTES CON DEUDA (PRIORIDAD)
    clients = db.query(Client).all()

    for client in clients:

        total_jobs = db.query(func.sum(Job.total))\
            .filter(Job.client_id == client.id)\
            .scalar() or 0

        total_paid = db.query(func.sum(Payment.amount))\
            .join(Job, Payment.job_id == Job.id)\
            .filter(Job.client_id == client.id)\
            .scalar() or 0

        debt = total_jobs - total_paid

        if debt > 0:
            # 🔥 nivel de severidad
            if debt > 1000:
                level = "high"
            elif debt > 500:
                level = "medium"
            else:
                level = "low"

            alerts.append({
                "type": "debt",
                "level": level,  # 🔥 NUEVO
                "message": f"{client.name} debe Bs {int(debt)}",
                "client_id": client.id  # 🔥 útil para frontend
            })

    # 🟡 2. TRABAJOS ATRASADOS
    jobs = db.query(Job).filter(Job.status != "paid").all()

    for job in jobs:
        days = (datetime.now() - job.created_at).days

        if days >= 7:

            level = "medium"
            if days >= 15:
                level = "high"

            alerts.append({
                "type": "delay",
                "level": level,
                "message": f"Trabajo #{job.id} sin pagar hace {days} días",
                "job_id": job.id
            })

    # 🔵 3. GASTOS ALTOS DE HOY
    total_expenses = db.query(func.sum(Expense.amount)).filter(
        extract("day", Expense.created_at) == extract("day", func.now()),
        extract("month", Expense.created_at) == extract("month", func.now()),
        extract("year", Expense.created_at) == extract("year", func.now()),
    ).scalar() or 0

    if total_expenses > 2000:

        level = "medium"
        if total_expenses > 4000:
            level = "high"

        alerts.append({
            "type": "expense",
            "level": level,
            "message": f"Gastos altos hoy: Bs {int(total_expenses)}"
        })

    # 🔥 4. ORDENAR POR PRIORIDAD
    priority_order = {"high": 0, "medium": 1, "low": 2}

    alerts.sort(key=lambda x: priority_order.get(x["level"], 3))

    # 🔥 5. LIMITAR (EVITA SPAM)
    return alerts[:10]

def get_expenses_by_category(db: Session):

    results = db.query(
        Expense.category,
        func.sum(Expense.amount)
    ).group_by(Expense.category).all()

    return [
        {
            "category": r[0],
            "total": float(r[1])
        }
        for r in results
    ]
