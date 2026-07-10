# Pathik — Testing Guide

## Quick Start (2 minutes)

```bash
# 1. Start the backend
cd /home/faraz/pathik/backend
npm run dev

# 2. In another terminal, run the full test
cd /home/faraz/pathik
./test-full-system.sh
```

## What Gets Tested (25 checks)

| # | Test | What it verifies |
|---|------|-----------------|
| 1 | Backend Health | Server is running |
| 2 | DB Readiness | MongoDB connected |
| 3 | Registration | User creates account |
| 4 | Login | JWT tokens issued |
| 5 | Profile | Trust score returned |
| 6 | Feed Post | Post creates with location |
| 7 | Feed Listing | Posts paginated correctly |
| 8 | Nearby Posts | Geo `$near` query works |
| 9 | Voting | Upvote increments count |
| 10 | SOS Alert | Emergency alert created |
| 11 | Alert Listing | Alerts returned with filters |
| 12 | Nearby Alerts | Geo alert query works |
| 13 | Sighting | Sighting reported for alert |
| 14 | Confirm Sighting | Second user confirms sighting |
| 15 | Flag Alert | Community flagging works |
| 16 | Alert Detail | Full alert with sightings |
| 17 | Emergency Post | Danger-typed feed post |
| 18 | Admin Dashboard | RBAC blocks non-admin |
| 19 | VAPID Key | Push notification key endpoint |
| 20 | Notifications | User notification listing |
| 21 | AI NLP | Bengali text classification |
| 22 | AI Image | Image analysis service |
| 23 | AI Clustering | HDBSCAN clustering |
| 24 | Rate Limiting | SOS 1/hour enforced |
| 25 | Post Deletion | Author can delete own post |

## Manual Testing with curl

### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@test.com","password":"Test@123456","displayName":"You"}'
```

### Create SOS
```bash
curl -X POST http://localhost:5000/api/v1/emergency/sos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"ছিনতাই! মিরপুর ১০","lat":23.8103,"lng":90.4125,"type":"robbery"}'
```

### List Nearby Alerts
```bash
curl "http://localhost:5000/api/v1/emergency/alerts/nearby?lat=23.8103&lng=90.4125&radius=5"
```

### Report Sighting
```bash
curl -X POST http://localhost:5000/api/v1/emergency/alerts/ALERT_ID/sighting \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lat":23.8105,"lng":90.4128,"description":"দেখেছি!"}'
```

### Test AI NLP
```bash
curl -X POST http://localhost:8001/classify \
  -H "Content-Type: application/json" \
  -d '{"text":"গুলশানে আগুন লেগেছে, ফায়ার সার্ভিস দরকার"}'
```

### Test AI Clustering
```bash
curl -X POST "http://localhost:8004/cluster?alert_id=test" \
  -H "Content-Type: application/json" \
  -d '[{"sighting_id":"s1","lat":23.8103,"lng":90.4125,"timestamp":"2026-07-09T10:00:00Z","trust_score":0.7}]'
```

## Starting AI Services (Docker)

```bash
cd /home/faraz/pathik/ai-services

# Start all AI services
docker-compose up -d

# Or start just the NLP service
docker-compose up ai-nlp

# Check logs
docker-compose logs -f ai-nlp
```

## Running Unit Tests

```bash
cd /home/faraz/pathik/backend

# Run all tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Frontend Testing

```bash
cd /home/faraz/pathik/frontend
npm run dev

# Open http://localhost:5173
# 1. Register/Login
# 2. Click "Emergency" tab
# 3. Click "+ SOS" to create alert
# 4. Click "দেখেছি" to report sighting
# 5. Open DevTools → Application → Service Workers (verify SW registered)
# 6. Open DevTools → Console (verify "SW registered:" message)
```

## Prerequisites

| Service | How to Start | Port |
|---------|-------------|------|
| Backend | `cd backend && npm run dev` | 5000 |
| MongoDB | Atlas or local `mongod` | 27017 |
| Frontend | `cd frontend && npm run dev` | 5173 |
| AI NLP | `docker-compose up ai-nlp` | 8001 |
| AI Image | `docker-compose up ai-image` | 8002 |
| AI Clustering | `docker-compose up ai-clustering` | 8004 |
| Redis | `docker-compose up redis` | 6379 |
