import cv2
from ultralytics import YOLO
import os
import threading
import time
from datetime import datetime, timedelta
from sqlalchemy import func
from app.core.database import SessionLocal
from app.models.epp_event import EPPEvent

# 🔥 CARGAR MODELO
model = YOLO("ai/runs/detect/train-4/weights/best.pt")
last_event_saved_at = {}
monitoring_enabled = threading.Event()
stats_lock = threading.Lock()

CAMERA_URL = os.getenv(
    "EPP_CAMERA_URL",
    "rtsp://admin:Cadmus271098.@192.168.1.6:554/cam/realmonitor?channel=1&subtype=0",
)
STREAM_WIDTH = int(os.getenv("EPP_STREAM_WIDTH", "720"))
STREAM_HEIGHT = int(os.getenv("EPP_STREAM_HEIGHT", "480"))
PROCESS_EVERY_N_FRAMES = int(os.getenv("EPP_PROCESS_EVERY_N_FRAMES", "2"))
JPEG_QUALITY = int(os.getenv("EPP_JPEG_QUALITY", "82"))
CONFIDENCE_THRESHOLD = float(os.getenv("EPP_CONFIDENCE_THRESHOLD", "0.35"))
VIOLATION_LABELS = {"no_helmet", "no_glasses", "no_safety_glasses", "no_gloves", "no_vest"}


def start_epp_monitoring():
    reset_live_stats()
    monitoring_enabled.set()
    return {"camera_on": True}


def stop_epp_monitoring():
    monitoring_enabled.clear()
    return {"camera_on": False}


def get_epp_monitoring_status():
    return {"camera_on": monitoring_enabled.is_set()}

def generate_frames():
    global total_detections, total_violations

    monitoring_enabled.set()

    cap = cv2.VideoCapture(CAMERA_URL, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, STREAM_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, STREAM_HEIGHT)

    frame_count = 0

    try:
        while monitoring_enabled.is_set():
            success, frame = cap.read()

            if not success:
                time.sleep(0.2)
                break

            frame_count += 1

            frame = cv2.resize(frame, (STREAM_WIDTH, STREAM_HEIGHT), interpolation=cv2.INTER_AREA)
            display_frame = cv2.convertScaleAbs(frame, alpha=1.08, beta=12)
            should_process = frame_count % max(1, PROCESS_EVERY_N_FRAMES) == 0

            if should_process:
                with stats_lock:
                    total_detections += 1

                results = model.predict(
                    display_frame,
                    imgsz=640,
                    conf=CONFIDENCE_THRESHOLD,
                    verbose=False,
                )

                violation_detected = False

                for r in results:
                    for box in r.boxes:
                        cls = int(box.cls[0])
                        label = model.names[cls]

                        if label in VIOLATION_LABELS:
                            violation_detected = True
                            confidence = float(box.conf[0]) if box.conf is not None else None
                            save_evidence(display_frame, label, confidence)

                    display_frame = r.plot(line_width=2, font_size=10)

                if violation_detected:
                    with stats_lock:
                        total_violations += 1

            _, buffer = cv2.imencode(".jpg", display_frame, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY])
            frame_bytes = buffer.tobytes()

            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")

    finally:
        cap.release()        
def save_evidence(frame, label, confidence=None):
    now = datetime.now()
    last_saved = last_event_saved_at.get(label)

    # Evita guardar decenas de evidencias iguales por segundo.
    if last_saved and (now - last_saved).total_seconds() < 10:
        return

    os.makedirs("evidence", exist_ok=True)

    file_name = f"{label}_{now.strftime('%Y%m%d_%H%M%S')}.jpg"
    filename = f"evidence/{file_name}"

    cv2.imwrite(filename, frame)
    last_event_saved_at[label] = now
    save_epp_event(label, confidence, f"/epp/evidence/{file_name}")


def save_epp_event(event_type, confidence, image_path):
    db = SessionLocal()

    try:
        event = EPPEvent(
            event_type=event_type,
            severity=get_event_severity(event_type),
            confidence=round(confidence * 100, 2) if confidence is not None else None,
            image_path=image_path,
            status="open"
        )
        db.add(event)
        db.commit()
    finally:
        db.close()


def get_event_severity(event_type):
    high = {"no_helmet", "no_glasses", "no_safety_glasses"}
    medium = {"no_gloves", "no_vest"}

    if event_type in high:
        return "high"
    if event_type in medium:
        return "medium"

    return "low"


# 🔥 variables globales simples (luego se mejora con DB)
total_detections = 0
total_violations = 0

def reset_live_stats():
    global total_detections, total_violations

    with stats_lock:
        total_detections = 0
        total_violations = 0

def get_epp_stats(db=None):
    global total_detections, total_violations
    close_db = False

    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        evidence_count = db.query(func.count(EPPEvent.id)).scalar() or 0
        open_events = db.query(func.count(EPPEvent.id))\
            .filter(EPPEvent.status == "open")\
            .scalar() or 0
        since = datetime.now() - timedelta(hours=24)
        recent_violations = db.query(func.count(EPPEvent.id))\
            .filter(EPPEvent.created_at >= since)\
            .scalar() or 0

        with stats_lock:
            detections = total_detections
            violations = total_violations

        compliance = 100

        if detections > 0:
            compliance = int(max(0, min(100, (1 - (violations / detections)) * 100)))

        if violations > 20 or recent_violations > 20:
            risk = "Alto"
        elif violations > 5 or recent_violations > 5:
            risk = "Medio"
        else:
            risk = "Bajo"

        return {
            "detections": detections,
            "violations": violations,
            "evidence_count": evidence_count,
            "open_events": open_events,
            "recent_violations": recent_violations,
            "compliance": compliance,
            "risk": risk
        }
    finally:
        if close_db:
            db.close()


def get_epp_events(db, limit=20):
    events = db.query(EPPEvent)\
        .order_by(EPPEvent.created_at.desc())\
        .limit(limit)\
        .all()

    return [
        {
            "id": event.id,
            "event_type": event.event_type,
            "severity": event.severity,
            "confidence": float(event.confidence) if event.confidence is not None else None,
            "image_path": event.image_path,
            "status": event.status,
            "created_at": event.created_at
        }
        for event in events
    ]


def get_evidence():
    db = SessionLocal()

    try:
        events = db.query(EPPEvent)\
            .filter(EPPEvent.image_path.isnot(None))\
            .order_by(EPPEvent.created_at.desc())\
            .limit(10)\
            .all()

        if events:
            return [
                {
                    "id": event.id,
                    "filename": os.path.basename(event.image_path),
                    "url": event.image_path,
                    "event_type": event.event_type,
                    "severity": event.severity,
                    "confidence": float(event.confidence) if event.confidence is not None else None,
                    "status": event.status,
                    "created_at": event.created_at
                }
                for event in events
            ]
    finally:
        db.close()

    folder = "evidence"

    if not os.path.exists(folder):
        return []

    files = os.listdir(folder)

    # ordenar por más recientes
    files.sort(reverse=True)

    return [
        {
            "filename": f,
            "url": f"/epp/evidence/{f}"
        }
        for f in files[:10]  # 🔥 solo últimas 10
    ]
