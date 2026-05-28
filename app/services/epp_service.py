import cv2
from ultralytics import YOLO
import os
import threading
from datetime import datetime, timedelta
from sqlalchemy import func
from app.core.database import SessionLocal
from app.models.epp_event import EPPEvent

# 🔥 CARGAR MODELO
model = YOLO("ai/runs/detect/train-11/weights/best.pt")
last_event_saved_at = {}
monitoring_enabled = threading.Event()


def start_epp_monitoring():
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

    url = "rtsp://admin:Cadmus271098.@192.168.1.4:554/cam/realmonitor?channel=1&subtype=1"

    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)

    frame_count = 0

    try:
        while monitoring_enabled.is_set():
            success, frame = cap.read()

            if not success:
                break

            frame_count += 1

            # 🔥 SOLO PROCESAR 1 DE CADA 3 FRAMES
            if frame_count % 3 != 0:
                continue

            # 🔥 REDUCIR CARGA
            frame = cv2.resize(frame, (480, 320))
            frame = cv2.convertScaleAbs(frame, alpha=1.2, beta=30)

            total_detections += 1

            # 🔥 MÁS RÁPIDO (sin stream=True)
            results = model(frame)

            alerts = []

            for r in results:
                for box in r.boxes:
                    cls = int(box.cls[0])
                    label = model.names[cls]

                    if label in ["no_glasses"]:
                        alerts.append(label)
                        total_violations += 1
                        confidence = float(box.conf[0]) if box.conf is not None else None
                        save_evidence(frame, label, confidence)

                frame = r.plot(line_width=2, font_size=10)

            # 🔥 MENOS PESO EN STREAM
            _, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
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
    high = {"no_helmet", "no_glasses"}
    medium = {"no_gloves", "no_vest"}

    if event_type in high:
        return "high"
    if event_type in medium:
        return "medium"

    return "low"


# 🔥 variables globales simples (luego se mejora con DB)
total_detections = 0
total_violations = 0

def get_epp_stats(db=None):
    global total_detections, total_violations
    close_db = False

    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        stored_violations = db.query(func.count(EPPEvent.id)).scalar() or 0
        open_events = db.query(func.count(EPPEvent.id))\
            .filter(EPPEvent.status == "open")\
            .scalar() or 0
        since = datetime.now() - timedelta(hours=24)
        recent_violations = db.query(func.count(EPPEvent.id))\
            .filter(EPPEvent.created_at >= since)\
            .scalar() or 0

        detections = max(total_detections, stored_violations)
        compliance = 0

        if detections > 0:
            compliance = int(max(0, (1 - (stored_violations / detections)) * 100))

        if recent_violations > 20:
            risk = "Alto"
        elif recent_violations > 5:
            risk = "Medio"
        else:
            risk = "Bajo"

        return {
            "detections": detections,
            "violations": stored_violations,
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
