import json
import time
import redis
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.config import REDIS_URL

app = FastAPI(title="Pathik NLP Classifier", version="1.0.0")

# Redis connection
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Model loading
MODEL_NAME = "csebuetnlp/banglabert"
tokenizer = None
model = None

CATEGORIES = [
    'accident', 'assault', 'robbery', 'harassment', 'medical',
    'fire', 'missing_person', 'stolen_vehicle', 'escaped_criminal',
    'traffic_jam', 'toll_extortion', 'police_checkpost',
    'natural_disaster', 'road_hazard', 'other'
]

SEVERITY_MAP = {
    'accident': 'high', 'assault': 'critical', 'robbery': 'critical',
    'harassment': 'high', 'medical': 'critical', 'fire': 'critical',
    'missing_person': 'critical', 'stolen_vehicle': 'high',
    'escaped_criminal': 'critical', 'traffic_jam': 'low',
    'toll_extortion': 'medium', 'police_checkpost': 'low',
    'natural_disaster': 'high', 'road_hazard': 'medium', 'other': 'low'
}

EMERGENCY_CATEGORIES = {
    'accident', 'assault', 'robbery', 'harassment', 'medical',
    'fire', 'missing_person', 'stolen_vehicle', 'escaped_criminal', 'natural_disaster'
}


class TextInput(BaseModel):
    text: str
    reference_type: str = "feed_post"
    reference_id: str = ""


class NLPResult(BaseModel):
    category: str
    severity: str
    is_emergency: bool
    confidence: float
    language: str
    sentiment: str
    entities: dict
    processing_time_ms: float


def load_model():
    global tokenizer, model
    try:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=len(CATEGORIES))
        model.eval()
        print(f"Model loaded: {MODEL_NAME}")
    except Exception as e:
        print(f"Model loading failed: {e}")
        print("Using rule-based fallback")


def extract_entities(text: str) -> dict:
    """Simple rule-based entity extraction for Bengali text."""
    entities = {"locations": [], "vehicles": [], "persons": []}

    # Common Dhaka locations
    location_keywords = [
        'মিরপুর', 'গুলশান', 'বনানী', 'ধানমন্ডি', 'মোহাম্মদপুর',
        'উত্তরা', 'যাত্রাবাড়ি', 'শাহজাহানপুর', 'কলোনী', 'রোড',
        'সড়ক', 'এলাকা', 'থানা', 'জেলা', 'বাজার'
    ]
    for kw in location_keywords:
        if kw in text:
            entities["locations"].append(kw)

    # Vehicle types
    vehicle_keywords = ['বাস', 'বাইক', 'সাইকেল', 'রিকশা', 'অটো', 'কার', 'ট্রাক', 'সিএনজি', 'গাড়ি']
    for kw in vehicle_keywords:
        if kw in text:
            entities["vehicles"].append(kw)

    return entities


def detect_language(text: str) -> str:
    """Detect if text is Bengali, English, or Roman Bengali."""
    bengali_chars = sum(1 for c in text if '\u0980' <= c <= '\u09FF')
    english_chars = sum(1 for c in text if c.isascii() and c.isalpha())
    total = len(text.strip())

    if total == 0:
        return "unknown"

    bengali_ratio = bengali_chars / total
    if bengali_ratio > 0.3:
        return "bn"
    elif english_chars / total > 0.5:
        return "en"
    else:
        return "roman"


def analyze_sentiment(text: str) -> str:
    """Simple sentiment analysis."""
    urgent_keywords = ['জরুরি', 'সাহায্য', 'বাঁচান', 'এখনই', 'দ্রুত', 'প্লিজ', 'help', 'emergency', 'urgent', 'ছিনতাই', 'মারধর', 'আগুন']
    for kw in urgent_keywords:
        if kw.lower() in text.lower():
            return "urgent"
    return "neutral"


def classify_text(text: str) -> dict:
    """Classify text using the model or rule-based fallback."""
    if model is None or tokenizer is None:
        return rule_based_classify(text)

    try:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512, padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1)[0]

        top_idx = torch.argmax(probs).item()
        confidence = probs[top_idx].item()

        return {
            "category": CATEGORIES[top_idx],
            "confidence": round(confidence, 4),
        }
    except Exception as e:
        print(f"Model inference failed: {e}")
        return rule_based_classify(text)


def rule_based_classify(text: str) -> dict:
    """Rule-based fallback classification."""
    text_lower = text.lower()

    rules = [
        (['ছিনতাই', 'ফোন ছিনিয়ে', 'চুরি', 'stolen', 'robbery'], 'robbery', 0.7),
        (['দুর্ঘটনা', 'সংঘর্ষ', 'accident', 'crash', 'ধাক্কা'], 'accident', 0.7),
        (['মারধর', 'পিটিয়ে', 'assault', 'beating'], 'assault', 0.7),
        (['ইভটিজিং', 'বিরক্ত', 'harassment', 'teasing'], 'harassment', 0.7),
        (['হার্ট অ্যাটাক', 'অসুস্থ', 'medical', 'ambulance', 'অ্যাম্বুলেন্স'], 'medical', 0.8),
        (['আগুন', 'fire', 'দালান কোঠা'], 'fire', 0.8),
        (['নিখোঁজ', 'missing', 'হারিয়ে গেছে'], 'missing_person', 0.8),
        (['নম্বর প্লেট', 'গাড়ি চুরি', 'vehicle stolen'], 'stolen_vehicle', 0.7),
        (['পালানো', 'escaped', 'ফেরারি'], 'escaped_criminal', 0.7),
        (['জ্যাম', 'traffic', 'যানজট'], 'traffic_jam', 0.6),
        (['চাঁদাবাজি', 'toll', 'extortion'], 'toll_extortion', 0.6),
        (['পুলিশ', 'চেকপোস্ট', 'police'], 'police_checkpost', 0.6),
        (['বৃষ্টি', 'বন্যা', 'flood', 'disaster'], 'natural_disaster', 0.7),
        (['গর্ত', 'hazard', 'ভাঙা'], 'road_hazard', 0.6),
    ]

    best_match = ('other', 0.5)
    for keywords, category, conf in rules:
        for kw in keywords:
            if kw in text_lower:
                if conf > best_match[1]:
                    best_match = (category, conf)
                break

    return {"category": best_match[0], "confidence": best_match[1]}


@app.on_event("startup")
async def startup():
    load_model()


@app.post("/classify", response_model=NLPResult)
async def classify(input: TextInput):
    start = time.time()

    result = classify_text(input.text)
    category = result["category"]
    confidence = result["confidence"]
    severity = SEVERITY_MAP.get(category, "low")
    is_emergency = category in EMERGENCY_CATEGORIES and confidence > 0.7
    language = detect_language(input.text)
    sentiment = analyze_sentiment(input.text)
    entities = extract_entities(input.text)

    processing_time = (time.time() - start) * 1000

    nlp_result = NLPResult(
        category=category,
        severity=severity,
        is_emergency=is_emergency,
        confidence=confidence,
        language=language,
        sentiment=sentiment,
        entities=entities,
        processing_time_ms=round(processing_time, 2),
    )

    # Publish result to Redis
    try:
        redis_client.publish("ai:nlp_result", json.dumps({
            "reference_type": input.reference_type,
            "reference_id": input.reference_id,
            "result": nlp_result.dict(),
        }))
    except Exception as e:
        print(f"Redis publish failed: {e}")

    return nlp_result


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
