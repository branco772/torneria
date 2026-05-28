from sqlalchemy.orm import Session
from models.client import Client
from models.job import Job


def create_client(db: Session, client_data):
    new_client = Client(
        name=client_data.name,
        phone=client_data.phone
    )

    db.add(new_client)
    db.commit()
    db.refresh(new_client)

    return new_client


def get_clients(db: Session):
    return db.query(Client).all()


def get_client(db: Session, client_id: int):
    return db.query(Client).filter(Client.id == client_id).first()


def update_client(db: Session, client_id: int, client_data):
    client = get_client(db, client_id)

    if not client:
        return None

    client.name = client_data.name
    client.phone = client_data.phone

    db.commit()
    db.refresh(client)

    return client


def delete_client(db: Session, client_id: int):
    client = get_client(db, client_id)

    if not client:
        return None

    db.delete(client)
    db.commit()

    return client

def get_client_stats(db: Session, client_id: int):
    jobs = db.query(Job).filter(Job.client_id == client_id).all()

    total_jobs = len(jobs)

    total_amount = 0.0
    total_paid = 0.0

    for j in jobs:
        # total
        total_amount += float(j.total or 0)

        # pagos (seguro)
        if j.payments:
            total_paid += sum(float(p.amount or 0) for p in j.payments)

    debt = total_amount - total_paid

    last_job_date = None
    if jobs:
        last_job_date = max(
            (j.created_at for j in jobs if j.created_at),
            default=None
        )

    return {
        "total_jobs": total_jobs,
        "total_amount": total_amount,
        "total_paid": total_paid,
        "debt": debt,
        "last_job_date": last_job_date
    }