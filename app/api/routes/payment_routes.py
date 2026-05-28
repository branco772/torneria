from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.payment import Payment
from app.models.job import Job
from app.services.job_service import update_job_status
from app.schemas.payment_schema import PaymentCreate, PaymentResponse
from app.core.security import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


# 🔥 Crear pago
@router.post("/payments", response_model=PaymentResponse)
def create_payment_route(
    payment_data: PaymentCreate = Body(...),
    db: Session = Depends(get_db)
):
    # verificar que el trabajo exista
    job = db.query(Job).filter(Job.id == payment_data.job_id).first()
    if not job:
        raise HTTPException(status_code=400, detail="El trabajo no existe")

    # crear pago
    new_payment = Payment(
        job_id=payment_data.job_id,
        amount=payment_data.amount,
        method=payment_data.method
    )

    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)

    # actualizar estado del trabajo
    update_job_status(db, job)

    return new_payment


# 🔥 Listar pagos
@router.get("/payments", response_model=list[PaymentResponse])
def get_payments_route(db: Session = Depends(get_db)):
    return db.query(Payment).all()


# 🔥 Pagos por trabajo
@router.get("/payments/job/{job_id}", response_model=list[PaymentResponse])
def get_payments_by_job_route(job_id: int, db: Session = Depends(get_db)):
    return db.query(Payment).filter(Payment.job_id == job_id).all()