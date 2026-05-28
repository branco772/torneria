from sqlalchemy import func
from sqlalchemy.orm import joinedload
from models.payment import Payment
from models.job import Job

from fastapi import HTTPException

def create_job(db, job_data):
    if job_data.status == "paid" and not job_data.payment_method:
        raise HTTPException(
            status_code=400,
            detail="Debe seleccionar método de pago"
        )

    if job_data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Cantidad inválida")

    if job_data.unit_price <= 0:
        raise HTTPException(status_code=400, detail="Precio inválido")

    total = job_data.quantity * job_data.unit_price

    new_job = Job(
        description=job_data.description,
        quantity=job_data.quantity,
        unit_price=job_data.unit_price,
        total=total,
        client_id=job_data.client_id,
        worker_id=job_data.worker_id,
        status=job_data.status
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    # 🔥 AUTO PAYMENT
    if job_data.status == "paid":
        payment = Payment(
            job_id=new_job.id,
            amount=new_job.total,
            method=job_data.payment_method
        )
        db.add(payment)
        db.commit()

        # 🔥 SINCRONIZAR ESTADO
        update_job_status(db, new_job)

    return new_job
#ver todos los trabajos
def get_jobs(db):
    return db.query(Job).options(
        joinedload(Job.client),
        joinedload(Job.worker),
        joinedload(Job.payments)
    ).all()

#calcular estado de pago
def calculate_payment_status(db, job_id, total):
    paid = db.query(func.sum(Payment.amount))\
        .filter(Payment.job_id == job_id)\
        .scalar()

    paid = paid or 0

    if paid == 0:
        return "pending"
    elif paid < total:
        return "credit"  # 🔥 CAMBIO AQUÍ
    else:
        return "paid"
#actualizar estado de trabajo
def update_job_status(db, job):
    status = calculate_payment_status(db, job.id, job.total)

    job.status = status
    db.commit()
    db.refresh(job)

    return job
#calcular 
def calculate_profit(job):
    return job.total * 0.30

