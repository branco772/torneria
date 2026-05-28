import cv2
import os

video_path = "dataset_lentes/videos/13.mp4"
output_folder = "dataset_lentes/frames"

os.makedirs(output_folder, exist_ok=True)

# 🔥 contar archivos existentes
existing_files = len(os.listdir(output_folder))

cap = cv2.VideoCapture(video_path)

frame_count = 0
saved_count = existing_files  # empieza desde el último

while True:
    ret, frame = cap.read()

    if not ret:
        break

    # Guardar 1 frame cada 15
    if frame_count % 15 == 0:
        filename = os.path.join(output_folder, f"frame_{saved_count}.jpg")
        cv2.imwrite(filename, frame)
        saved_count += 1

    frame_count += 1

cap.release()

print(f"Frames guardados: {saved_count - existing_files}")