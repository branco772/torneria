from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.models.job import Job

from app.core.deps import get_db
from app.schemas.job_schema import JobCreate, JobResponse
from app.services.job_service import create_job, get_jobs
from app.core.security import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


#CREAR TRABAJO
@router.post("/jobs", response_model=JobResponse)
def create_new_job(job: JobCreate, db: Session = Depends(get_db)):
    return create_job(db, job)


#LISTAR TRABAJOS
@router.get("/jobs", response_model=list[JobResponse])
def list_jobs(db: Session = Depends(get_db)):
    return get_jobs(db)


# ELIMINAR TRABAJO
@router.delete("/jobs/{id}")
def delete_job(id: int, db: Session = Depends(get_db)):

    job = db.query(Job).filter(Job.id == id).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Trabajo no encontrado"
        )

    # 🔥 NO permitir borrar si tiene pagos
    if job.payments and len(job.payments) > 0:
        raise HTTPException(
            status_code=400,
            detail="No puedes eliminar un trabajo con pagos registrados"
        )

    db.delete(job)
    db.commit()

    return {
        "message": "Trabajo eliminado"
    }