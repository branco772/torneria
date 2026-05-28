from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from datetime import date
import csv
from io import StringIO

from core.deps import get_db
from schemas.report_schema import DailyReportResponse, WorkerProfitResponse, RangeReportResponse
from services.report_service import (
    get_daily_report,
    get_profit_by_worker,
    get_report_by_range,
    get_reports_summary,
    get_reports_monthly,
    get_reports_expenses_by_category,
    get_reports_profit,
    get_reports_top_jobs
)
from core.security import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


# 🔥 Reporte diario
@router.get("/reports/daily", response_model=DailyReportResponse)
def daily_report(
    report_date: date,
    db: Session = Depends(get_db)
):
    return get_daily_report(db, report_date)

@router.get("/reports/worker-profit", response_model=list[WorkerProfitResponse])
def worker_profit(db: Session = Depends(get_db)):
    return get_profit_by_worker(db)

@router.get("/reports/range", response_model=RangeReportResponse)
def report_by_range(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db)
):

    # ❌ validación clave
    if start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="La fecha inicial no puede ser mayor a la final"
        )

    return get_report_by_range(db, start_date, end_date)

@router.get("/reports/summary")
def reports_summary(
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    db: Session = Depends(get_db)
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=400, detail="La fecha inicial no puede ser mayor a la final")

    return get_reports_summary(db, start_date, end_date, category)

@router.get("/reports/monthly")
def reports_monthly(
    year: int,
    db: Session = Depends(get_db)
):
    return get_reports_monthly(db, year)

@router.get("/reports/expenses-by-category")
def reports_expenses_by_category(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db)
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=400, detail="La fecha inicial no puede ser mayor a la final")

    return get_reports_expenses_by_category(db, start_date, end_date)

@router.get("/reports/profit")
def reports_profit(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db)
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=400, detail="La fecha inicial no puede ser mayor a la final")

    return get_reports_profit(db, start_date, end_date)

@router.get("/reports/top-jobs")
def reports_top_jobs(
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=400, detail="La fecha inicial no puede ser mayor a la final")

    return get_reports_top_jobs(db, start_date, end_date, limit)

@router.get("/reports/export/excel")
def export_reports_excel(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db)
):
    summary = get_reports_summary(db, start_date, end_date)
    top_jobs = get_reports_top_jobs(db, start_date, end_date, 20)
    output = StringIO()
    writer = csv.writer(output, delimiter="\t")

    writer.writerow(["Tornería MORALES"])
    writer.writerow(["Reporte", "Resumen ejecutivo"])
    writer.writerow([])
    writer.writerow(["Indicador", "Valor"])
    for key, value in summary.items():
        writer.writerow([key, value])
    writer.writerow([])
    writer.writerow(["Trabajo", "Cliente", "Ingreso", "Gastos", "Ganancia"])
    for job in top_jobs:
        writer.writerow([job["job"], job["client"], job["income"], job["expenses"], job["profit"]])

    return Response(
        content=output.getvalue(),
        media_type="application/vnd.ms-excel",
        headers={"Content-Disposition": "attachment; filename=reportes-torneria-morales.xls"}
    )

@router.get("/reports/export/pdf")
def export_reports_pdf(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db)
):
    summary = get_reports_summary(db, start_date, end_date)
    body = [
        "Tornería MORALES",
        "Reporte ejecutivo",
        f"Ingresos: Bs {summary['total_income']:.2f}",
        f"Gastos: Bs {summary['total_expenses']:.2f}",
        f"Ganancia neta: Bs {summary['net_profit']:.2f}",
        "Para PDF con gráficos usar jsPDF/html2canvas o ReportLab en producción."
    ]

    return Response(
        content="\n".join(body),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=reportes-torneria-morales.pdf"}
    )
