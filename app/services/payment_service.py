from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.models.job import Job
from app.services.job_service import update_job_status

from fastapi import HTTPException
from sqlalchemy import func

HIDDEN_STATUS = "hidden"

#Crear pago
def create_payment(db: Session, payment_data):

    # 🔍 buscar trabajo
    job = db.query(Job)\
        .filter(
            Job.id == payment_data.job_id,
            Job.visibility_status != HIDDEN_STATUS
        )\
        .first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no existe")

    # ❌ validar monto positivo
    if payment_data.amount <= 0:
        raise HTTPException(status_code=400, detail="Monto inválido")

    # 🔥 total ya pagado
    paid = db.query(func.sum(Payment.amount))\
        .filter(Payment.job_id == job.id)\
        .scalar()

    paid = float(paid or 0)

    # 🔥 deuda restante
    remaining = job.total - paid

    # ❌ evitar sobrepago
    if payment_data.amount > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"El pago excede la deuda. Falta pagar: {remaining}"
        )

    # ✅ crear pago
    new_payment = Payment(
        job_id=payment_data.job_id,
        amount=payment_data.amount,
        method=payment_data.method
    )

    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)

    update_job_status(db, job)

    return new_payment


#listar pagos
def get_payments(db: Session):
    return db.query(Payment)\
        .join(Job, Payment.job_id == Job.id)\
        .filter(Job.visibility_status != HIDDEN_STATUS)\
        .all()


#pagos por trabajo
def get_payments_by_job(db: Session, job_id: int):
    job = db.query(Job)\
        .filter(
            Job.id == job_id,
            Job.visibility_status != HIDDEN_STATUS
        )\
        .first()

    if not job:
        return []

    return db.query(Payment).filter(Payment.job_id == job_id).all()
