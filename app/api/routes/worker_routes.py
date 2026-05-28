from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from core.deps import get_db
from schemas.worker_schema import WorkerCreate, WorkerResponse
from services.worker_service import (
    create_worker,
    get_workers,
    get_worker,
    update_worker,
    delete_worker
)
from core.security import get_current_user
router = APIRouter(dependencies=[Depends(get_current_user)])


# 🔥 Crear trabajador
@router.post("/workers", response_model=WorkerResponse)
def create_new_worker(
    worker: WorkerCreate = Body(...),
    db: Session = Depends(get_db)
):
    return create_worker(db, worker)


# 🔥 Listar
@router.get("/workers", response_model=list[WorkerResponse])
def list_workers(db: Session = Depends(get_db)):
    return get_workers(db)


# 🔥 Obtener uno
@router.get("/workers/{worker_id}", response_model=WorkerResponse)
def get_one_worker(worker_id: int, db: Session = Depends(get_db)):
    worker = get_worker(db, worker_id)

    if not worker:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")

    return worker


# 🔥 Actualizar
@router.put("/workers/{worker_id}", response_model=WorkerResponse)
def update_one_worker(
    worker_id: int,
    worker: WorkerCreate = Body(...),
    db: Session = Depends(get_db)
):
    updated = update_worker(db, worker_id, worker)

    if not updated:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")

    return updated


# 🔥 Eliminar
@router.delete("/workers/{worker_id}")
def delete_one_worker(worker_id: int, db: Session = Depends(get_db)):
    deleted = delete_worker(db, worker_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")

    return {"message": "Trabajador eliminado"}