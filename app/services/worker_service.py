from sqlalchemy.orm import Session
from app.models.worker import Worker


# 🔥 Crear trabajador
def create_worker(db: Session, worker_data):
    new_worker = Worker(
        name=worker_data.name
    )

    db.add(new_worker)
    db.commit()
    db.refresh(new_worker)

    return new_worker


# 🔥 Listar todos
def get_workers(db: Session):
    return db.query(Worker).order_by(Worker.id.desc()).all()


# 🔥 Obtener uno
def get_worker(db: Session, worker_id: int):
    return db.query(Worker).filter(Worker.id == worker_id).first()


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

    db.delete(worker)
    db.commit()

    return worker