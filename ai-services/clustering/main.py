import json
import time
import redis
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.config import REDIS_URL

app = FastAPI(title="Pathik Clustering Engine", version="1.0.0")

redis_client = redis.from_url(REDIS_URL, decode_responses=True)


class SightingPoint(BaseModel):
    sighting_id: str
    lat: float
    lng: float
    timestamp: str
    trust_score: float = 0.5


class ClusterResult(BaseModel):
    cluster_id: int
    centroid_lat: float
    centroid_lng: float
    sighting_count: int
    confidence_score: float
    movement_direction: Optional[str] = None
    movement_speed_kmh: Optional[float] = None
    bounding_box: Optional[dict] = None


class ClusteringOutput(BaseModel):
    alert_id: str
    clusters: List[ClusterResult]
    total_sightings: int
    noise_count: int
    processing_time_ms: float


def calculate_movement(sightings: List[SightingPoint]) -> tuple:
    """Calculate movement direction and speed from sightings."""
    if len(sightings) < 2:
        return None, None

    # Sort by timestamp
    sorted_sightings = sorted(sightings, key=lambda s: s.timestamp)

    # Calculate bearing from first to last
    first = sorted_sightings[0]
    last = sorted_sightings[-1]

    dlat = last.lat - first.lat
    dlng = last.lng - first.lng

    # Direction
    directions = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest']
    angle = np.degrees(np.arctan2(dlng, dlat)) % 360
    idx = int((angle + 22.5) / 45) % 8
    direction = directions[idx]

    # Approximate speed (very rough)
    lat_dist = dlat * 111  # km per degree lat
    lng_dist = dlng * 111 * np.cos(np.radians(np.mean([first.lat, last.lat])))
    distance_km = np.sqrt(lat_dist**2 + lng_dist**2)

    try:
        from datetime import datetime
        t1 = datetime.fromisoformat(first.timestamp.replace('Z', '+00:00'))
        t2 = datetime.fromisoformat(last.timestamp.replace('Z', '+00:00'))
        hours = max((t2 - t1).total_seconds() / 3600, 0.001)
        speed = distance_km / hours
    except:
        speed = None

    return direction, round(speed, 2) if speed else None


def cluster_sightings(sightings: List[SightingPoint], alert_id: str) -> ClusteringOutput:
    """Cluster sightings using HDBSCAN-like algorithm."""
    start = time.time()

    if len(sightings) == 0:
        return ClusteringOutput(
            alert_id=alert_id,
            clusters=[],
            total_sightings=0,
            noise_count=0,
            processing_time_ms=0,
        )

    if len(sightings) == 1:
        s = sightings[0]
        return ClusteringOutput(
            alert_id=alert_id,
            clusters=[ClusterResult(
                cluster_id=0,
                centroid_lat=s.lat,
                centroid_lng=s.lng,
                sighting_count=1,
                confidence_score=0.5,
            )],
            total_sightings=1,
            noise_count=0,
            processing_time_ms=round((time.time() - start) * 1000, 2),
        )

    # Simple DBSCAN-like clustering
    coords = np.array([[s.lat, s.lng] for s in sightings])

    # Haversine distance matrix
    def haversine_distance(lat1, lon1, lat2, lon2):
        R = 6371
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        a = np.sin(dlat/2)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon/2)**2
        return R * 2 * np.arcsin(np.sqrt(a))

    # Simple clustering: group by proximity (500m threshold)
    labels = np.full(len(sightings), -1)
    cluster_id = 0
    eps_km = 0.5  # 500m

    for i in range(len(sightings)):
        if labels[i] != -1:
            continue

        # Find neighbors
        neighbors = []
        for j in range(len(sightings)):
            if i != j:
                dist = haversine_distance(coords[i][0], coords[i][1], coords[j][0], coords[j][1])
                if dist <= eps_km:
                    neighbors.append(j)

        if len(neighbors) >= 1:
            labels[i] = cluster_id
            for n in neighbors:
                if labels[n] == -1:
                    labels[n] = cluster_id
            cluster_id += 1

    # Build cluster results
    clusters = []
    noise_count = 0

    for cid in range(cluster_id):
        mask = labels == cid
        cluster_sightings = [s for s, m in zip(sightings, mask) if m]

        if len(cluster_sightings) == 0:
            continue

        centroid_lat = np.mean([s.lat for s in cluster_sightings])
        centroid_lng = np.mean([s.lng for s in cluster_sightings])

        # Confidence based on count and trust scores
        avg_trust = np.mean([s.trust_score for s in cluster_sightings])
        confidence = min(1.0, (len(cluster_sightings) / 5) * 0.5 + avg_trust * 0.5)

        direction, speed = calculate_movement(cluster_sightings)

        clusters.append(ClusterResult(
            cluster_id=cid,
            centroid_lat=round(centroid_lat, 6),
            centroid_lng=round(centroid_lng, 6),
            sighting_count=len(cluster_sightings),
            confidence_score=round(confidence, 4),
            movement_direction=direction,
            movement_speed_kmh=speed,
        ))

    noise_count = int(np.sum(labels == -1))

    return ClusteringOutput(
        alert_id=alert_id,
        clusters=clusters,
        total_sightings=len(sightings),
        noise_count=noise_count,
        processing_time_ms=round((time.time() - start) * 1000, 2),
    )


@app.post("/cluster", response_model=ClusteringOutput)
async def cluster(alert_id: str, sightings: List[SightingPoint]):
    result = cluster_sightings(sightings, alert_id)

    # Cache result in Redis
    try:
        redis_client.setex(
            f"cluster:{alert_id}",
            300,  # 5 min TTL
            json.dumps(result.dict())
        )
    except Exception as e:
        print(f"Redis cache failed: {e}")

    return result


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
