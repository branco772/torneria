from sqlalchemy.orm import Session
from app.models.worker import Worker

HIDDEN_STATUS = "hidden"


# 🔥 Crear trabajador
def create_worker(db: Session, worker_data):
    new_worker = Worker(
        name=worker_data.name,
        visibility_status="active"
    )

    db.add(new_worker)
    db.commit()
    db.refresh(new_worker)

    return new_worker


# 🔥 Listar todos
def get_workers(db: Session):
    return db.query(Worker)\
        .filter(Worker.visibility_status != HIDDEN_STATUS)\
        .order_by(Worker.id.desc())\
        .all()


# 🔥 Obtener uno
def get_worker(db: Session, worker_id: int):
    return db.query(Worker)\
        .filter(
            Worker.id == worker_id,
            Worker.visibility_status != HIDDEN_STATUS
        )\
        .first()


# 🔥 Actualizar
def update_worker(db: Session, worker_id: int, worker_data):
    worker = get_worker(db, worker_id)

    if not worker:
        return None

    worker.name = worker_data.name

    db.commit()
    db.refresh(worker)

    return worker


# 🔥 Eliminar
def delete_worker(db: Session, worker_id: int):
    worker = get_worker(db, worker_id)

    if not worker:
        return None

    worker.visibility_status = HIDDEN_STATUS
    db.commit()
    db.refresh(worker)

    return worker
