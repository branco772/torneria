from ultralytics import YOLO
import cv2

# Modelo
model = YOLO("yolov8n.pt")

# Webcam
cap = cv2.VideoCapture("http://192.168.100.5:8080/video")

while True:
    ret, frame = cap.read()

    if not ret:
        break

    # Inferencia
    results = model(frame, device=0)

    persons = 0

    for r in results:
        boxes = r.boxes

        for box in boxes:
            cls = int(box.cls[0])

            # Clase persona en COCO = 0
            if cls == 0:
                persons += 1

    annotated_frame = results[0].plot()

    # Mostrar conteo
    cv2.putText(
        annotated_frame,
        f"Personas: {persons}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
    )

    cv2.imshow("Person Detection", annotated_frame)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()