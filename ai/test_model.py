from ultralytics import YOLO

model = YOLO("runs/detect/train-2/weights/best.pt")

print(model.names)