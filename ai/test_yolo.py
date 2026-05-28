from ultralytics import YOLO
import cv2

# Cargar modelo YOLO
model = YOLO("yolov8n.pt")

# Abrir webcam
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()

    if not ret:
        print("No se pudo leer la cámara")
        break

    # Ejecutar detección usando GPU
    results = model(frame, device=0)

    # Dibujar detecciones
    annotated_frame = results[0].plot()

    # Mostrar resultado
    cv2.imshow("YOLO Detection", annotated_frame)

    # ESC para salir
    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()