import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/pathik")
NLP_MODEL_PATH = os.getenv("NLP_MODEL_PATH", "/models/banglabert.onnx")
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "/models/yolov8x.onnx")
OCR_MODEL_PATH = os.getenv("OCR_MODEL_PATH", "/models/paddleocr")
VIT_MODEL_PATH = os.getenv("VIT_MODEL_PATH", "/models/vit-deepfake")
