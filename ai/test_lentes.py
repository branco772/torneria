import cv2
from ultralytics import YOLO
import time

# Modelo
model = YOLO("runs/detect/train-11/weights/best.pt")

# Substream para menos delay
url = "rtsp://admin:Cadmus271098.@192.168.1.4:554/cam/realmonitor?channel=1&subtype=1"
cap = cv2.VideoCapture(url)

# Reducir buffer
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

prev_time = 0

while True:
    # Limpiar buffer (reduce retraso)
    for _ in range(2):
        cap.grab()

    ret, frame = cap.read()
    if not ret:
        print("Error al leer cámara")
        break

    # Reducir tamaño (mejor rendimiento)
    frame = cv2.resize(frame, (640, 480))

    # 🔥 Predicción SIN zoom
    results = model(
        frame,
        conf=0.2,
        imgsz=640,
        device=0,
        verbose=False
    )

    annotated = results[0].plot()

    # FPS
    current_time = time.time()
    fps = 1 / (current_time - prev_time) if prev_time != 0 else 0
    prev_time = current_time

    cv2.putText(annotated, f"FPS: {int(fps)}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

    cv2.imshow("Deteccion Lentes", annotated)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()


#import cv2
#import os
#from datetime import datetime
#
##url = "rtsp://admin:Cadmus271098.@192.168.1.4:554/cam/realmonitor?channel=1&subtype=1"
#
#cap = cv2.VideoCapture(0)
#
#fecha = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
#path = f"dataset/{fecha}"
#os.makedirs(path, exist_ok=True)
#
#contador = 0
#
#print("📸 Capturando imágenes...")
#
#while True:
#    ret, frame = cap.read()
#    if not ret:
#        break
#
#    # Guardar cada 10 frames (evita duplicados)
#    if contador % 10 == 0:
#        cv2.imwrite(f"{path}/img_{contador}.jpg", frame)
#
#    contador += 1
#
#    cv2.imshow("Captura Dataset", frame)
#
#    if cv2.waitKey(1) == 27:
#        break
#
#cap.release()
#cv2.destroyAllWindows()