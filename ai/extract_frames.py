import cv2
import os

video_path = "v3.mp4"
output_folder = "dataset_lentes/frames_sin_lentes"

os.makedirs(output_folder, exist_ok=True)

# Contar archivos existentes
existing_files = len(os.listdir(output_folder))

cap = cv2.VideoCapture(video_path)

# Obtener FPS del video
fps = int(cap.get(cv2.CAP_PROP_FPS))
print(f"FPS detectados: {fps}")

# Guardar 1 frame cada 5 segundos
frame_interval = fps * 5

frame_count = 0
saved_count = existing_files

while True:
    ret, frame = cap.read()

    if not ret:
        break

    if frame_count % frame_interval == 0:
        filename = os.path.join(output_folder, f"frame_{saved_count}.jpg")
        cv2.imwrite(filename, frame)
        saved_count += 1

    frame_count += 1

cap.release()

print(f"Frames guardados: {saved_count - existing_files}")