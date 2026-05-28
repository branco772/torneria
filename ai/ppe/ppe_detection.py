from ultralytics import YOLO
import cv2

# Modelo YOLO base
model = YOLO("yolov8n.pt")

# Cámara IP
cap = cv2.VideoCapture("http://192.168.100.5:8080/video")

cv2.namedWindow("PPE Detection", cv2.WINDOW_NORMAL)
cv2.resizeWindow("PPE Detection", 960, 540)

while True:
    ret, frame = cap.read()
    frame = cv2.resize(frame, (960, 540))

    if not ret:
        print("Error leyendo cámara")
        break

    # Detección
    results = model(frame, device=0)

    persons = 0

    for r in results:
        boxes = r.boxes

        for box in boxes:
            cls = int(box.cls[0])

            # Clase persona
            if cls == 0:
                persons += 1

                x1, y1, x2, y2 = map(int, box.xyxy[0])

                cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)

                cv2.putText(
                    frame,
                    "PERSONA DETECTADA",
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0,255,0),
                    2
                )

    # Conteo
    cv2.putText(
        frame,
        f"Personas: {persons}",
        (20,40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0,255,0),
        2
    )

    cv2.imshow("PPE Detection", frame)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()