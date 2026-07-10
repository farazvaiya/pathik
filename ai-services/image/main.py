import json
import time
import io
import redis
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.config import REDIS_URL

app = FastAPI(title="Pathik Image Analyzer", version="1.0.0")

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Model placeholders - will be loaded on startup
yolo_model = None
ocr_engine = None


class DetectedObject(BaseModel):
    class_name: str
    confidence: float
    bbox: List[float]


class LicensePlate(BaseModel):
    text: str
    confidence: float


class PersonAttributes(BaseModel):
    gender: Optional[str] = None
    age_group: Optional[str] = None
    clothing_color: Optional[str] = None


class VehicleAttributes(BaseModel):
    vehicle_type: Optional[str] = None
    color: Optional[str] = None


class ImageAnalysisResult(BaseModel):
    objects: List[DetectedObject]
    license_plates: List[LicensePlate]
    person_attributes: List[PersonAttributes]
    vehicle_attributes: List[VehicleAttributes]
    deepfake_score: float
    is_ai_generated: bool
    processing_time_ms: float


OBJECT_CLASSES = ['person', 'bike', 'car', 'bus', 'truck', 'rickshaw', 'auto-rickshaw', 'motorcycle']

VEHICLE_COLORS = ['সাদা', 'কালো', 'লাল', 'নীল', 'সিলভার', 'হলুদ', 'সবুজ', 'white', 'black', 'red', 'blue', 'silver']
CLOTHING_COLORS = ['কালো', 'সাদা', 'নীল', 'লাল', 'সবুজ', 'হলুদ', 'বাদামি']
AGE_GROUPS = ['child', 'teenager', 'adult', 'elderly']


def load_models():
    global yolo_model, ocr_engine
    try:
        # YOLO model loading placeholder
        # In production: yolo_model = YOLO(config.YOLO_MODEL_PATH)
        print("YOLO model placeholder loaded")
    except Exception as e:
        print(f"YOLO loading failed: {e}")

    try:
        # PaddleOCR loading placeholder
        # In production: ocr_engine = PaddleOCR(use_angle_cls=True, lang='bn')
        print("OCR engine placeholder loaded")
    except Exception as e:
        print(f"OCR loading failed: {e}")


def detect_objects(image_bytes: bytes) -> List[DetectedObject]:
    """Detect objects in image using YOLO."""
    # Placeholder - in production, use actual YOLO inference
    # For now, return mock data based on file size heuristics
    return []


def extract_license_plates(image_bytes: bytes) -> List[LicensePlate]:
    """Extract license plate text using OCR."""
    # Placeholder - in production, use PaddleOCR
    return []


def classify_person_attributes(image_bytes: bytes) -> List[PersonAttributes]:
    """Classify person attributes (gender, age, clothing)."""
    # Placeholder - in production, use ResNet attribute classifier
    return []


def classify_vehicle_attributes(image_bytes: bytes) -> List[VehicleAttributes]:
    """Classify vehicle attributes (type, color)."""
    # Placeholder - in production, use attribute classifier
    return []


def check_deepfake(image_bytes: bytes) -> float:
    """Check if image is AI-generated using ViT."""
    # Placeholder - in production, use Vision Transformer
    return 0.0


@app.on_event("startup")
async def startup():
    load_models()


@app.post("/analyze", response_model=ImageAnalysisResult)
async def analyze_image(file: UploadFile = File(...), reference_type: str = "feed_post", reference_id: str = ""):
    start = time.time()

    contents = await file.read()

    objects = detect_objects(contents)
    license_plates = extract_license_plates(contents)
    person_attrs = classify_person_attributes(contents)
    vehicle_attrs = classify_vehicle_attributes(contents)
    deepfake_score = check_deepfake(contents)

    processing_time = (time.time() - start) * 1000

    result = ImageAnalysisResult(
        objects=objects,
        license_plates=license_plates,
        person_attributes=person_attrs,
        vehicle_attributes=vehicle_attrs,
        deepfake_score=deepfake_score,
        is_ai_generated=deepfake_score > 0.7,
        processing_time_ms=round(processing_time, 2),
    )

    # Publish to Redis
    try:
        redis_client.publish("ai:image_result", json.dumps({
            "reference_type": reference_type,
            "reference_id": reference_id,
            "result": result.dict(),
        }))
    except Exception as e:
        print(f"Redis publish failed: {e}")

    return result


@app.get("/health")
async def health():
    return {"status": "ok", "yolo_loaded": yolo_model is not None, "ocr_loaded": ocr_engine is not None}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
