from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from core.deps import get_db
from services.epp_service import (
    generate_frames,
    get_evidence,
    get_epp_stats,
    get_epp_events,
    get_epp_monitoring_status,
    start_epp_monitoring,
    stop_epp_monitoring,
)
import os

router = APIRouter()

@router.post("/epp/start")
def start_epp():
    return start_epp_monitoring()

@router.post("/epp/stop")
def stop_epp():
    return stop_epp_monitoring()

@router.get("/epp/status")
def epp_status():
    return get_epp_monitoring_status()

@router.get("/epp/video")
def video_feed():
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/epp/evidence")
def list_evidence():
    return get_evidence()

@router.get("/epp/stats")
def epp_stats(db: Session = Depends(get_db)):
    return get_epp_stats(db)

@router.get("/epp/events")
def epp_events(limit: int = 20, db: Session = Depends(get_db)):
    return get_epp_events(db, limit)


@router.get("/epp/evidence/{filename}")
def get_image(filename: str):

    path = os.path.join("evidence", filename)

    return FileResponse(path)
