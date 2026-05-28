from ultralytics import YOLO
import cv2

# Cargar modelo entrenado
model = YOLO("runs/detect/train-2/weights/best.pt")

# Cámara IP del celular
cap = cv2.VideoCapture("http://192.168.100.5:8080/video")

# Ventana redimensionable
cv2.namedWindow("PPE Detection", cv2.WINDOW_NORMAL)
cv2.resizeWindow("PPE Detection", 960, 540)

while True:
    ret, frame = cap.read()

    if not ret:
        print("Error leyendo cámara")
        break

    # Reducir tamaño para mejor rendimiento
    frame = cv2.resize(frame, (960, 540))

    # Inferencia PPE
    results = model(frame, device=0)

    # Dibujar resultados
    annotated_frame = results[0].plot()

    # Mostrar
    cv2.imshow("PPE Detection", annotated_frame)

    # ESC para salir
    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()