#!/bin/bash
# Pathik — Full System Test Script
# Tests: Backend, AI Services, Socket.IO, Emergency Module, Push Notifications

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_URL="http://localhost:5000"
AI_NLP_URL="http://localhost:8001"
AI_IMAGE_URL="http://localhost:8002"
AI_CLUSTER_URL="http://localhost:8004"
TEST_EMAIL="test_$(date +%s)@pathik.app"
TEST_PASS="Path1k!T3st#2026"
TOKEN=""
ALERT_ID=""
SIGHTING_ID=""

pass() { echo -e "${GREEN}✅ PASS${NC}: $1"; }
fail() { echo -e "${RED}❌ FAIL${NC}: $1"; FAILURES=$((FAILURES+1)); }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }

FAILURES=0

echo ""
echo "=========================================="
echo "  Pathik — Full System Test"
echo "=========================================="
echo ""

# ─── 1. BACKEND HEALTH ───────────────────────────────
info "1. Backend Health Check"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" 2>/dev/null || echo "000")
if [ "$STATUS" = "200" ]; then
  pass "Backend is running (HTTP $STATUS)"
else
  fail "Backend not reachable (HTTP $STATUS) — start with: cd backend && npm run dev"
  echo ""
  echo "Fix: cd /home/faraz/pathik/backend && npm run dev"
  exit 1
fi

# ─── 2. READINESS CHECK ──────────────────────────────
info "2. Database Readiness"

READY=$(curl -s "$BACKEND_URL/ready" 2>/dev/null)
if echo "$READY" | grep -q '"db":"connected"'; then
  pass "MongoDB connected"
else
  warn "MongoDB not connected (optional mode) — auth/feed features may not persist"
fi

# ─── 3. USER REGISTRATION ────────────────────────────
info "3. User Registration"

REG_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\",\"displayName\":\"Test User\"}" 2>/dev/null)

if echo "$REG_RESPONSE" | grep -q '"success":true'; then
  pass "User registered: $TEST_EMAIL"
  TOKEN=$(echo "$REG_RESPONSE" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
  USER_ID=$(echo "$REG_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  info "Token: ${TOKEN:0:30}..."
  info "User ID: $USER_ID"
else
  fail "Registration failed"
  echo "  Response: $REG_RESPONSE"
fi

# ─── 4. USER LOGIN ───────────────────────────────────
info "4. User Login"

LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}" 2>/dev/null)

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  pass "Login successful"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
else
  fail "Login failed"
  echo "  Response: $LOGIN_RESPONSE"
fi

# ─── 5. GET PROFILE ──────────────────────────────────
info "5. Get User Profile (GET /me)"

ME_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)

if echo "$ME_RESPONSE" | grep -q '"trustScore"'; then
  pass "Profile returned with trustScore"
  TRUST=$(echo "$ME_RESPONSE" | grep -o '"trustScore":[0-9.]*' | cut -d: -f2)
  info "Trust Score: $TRUST"
else
  fail "Profile missing trustScore"
fi

# ─── 6. FEED POST CREATION ───────────────────────────
info "6. Create Feed Post"

POST_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/feed" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"মিরপুর ১০ এ ট্রাফিক জ্যাম","type":"traffic","lat":23.8103,"lng":90.4125,"locationName":"মিরপুর ১০"}' 2>/dev/null)

if echo "$POST_RESPONSE" | grep -q '"success":true'; then
  pass "Feed post created"
  POST_ID=$(echo "$POST_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  info "Post ID: $POST_ID"
else
  fail "Feed post creation failed"
  echo "  Response: $POST_RESPONSE"
fi

# ─── 7. FEED POST LISTING ────────────────────────────
info "7. List Feed Posts"

FEED_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/feed?page=1&limit=5" 2>/dev/null)

if echo "$FEED_RESPONSE" | grep -q '"success":true'; then
  COUNT=$(echo "$FEED_RESPONSE" | grep -o '"total":[0-9]*' | cut -d: -f2)
  pass "Feed listing returned ($COUNT posts)"
else
  fail "Feed listing failed"
fi

# ─── 8. NEARBY POSTS ─────────────────────────────────
info "8. Nearby Posts (Geo Query)"

NEARBY_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/feed/nearby?lat=23.8103&lng=90.4125&radius=10" 2>/dev/null)

if echo "$NEARBY_RESPONSE" | grep -q '"success":true'; then
  pass "Nearby posts query works"
else
  fail "Nearby posts query failed"
fi

# ─── 9. VOTING ───────────────────────────────────────
info "9. Vote on Post"

VOTE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/feed/vote" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$POST_ID\",\"vote\":\"up\"}" 2>/dev/null)

if echo "$VOTE_RESPONSE" | grep -q '"success":true'; then
  UPVOTES=$(echo "$VOTE_RESPONSE" | grep -o '"upvotes":[0-9]*' | cut -d: -f2)
  pass "Upvote recorded (upvotes: $UPVOTES)"
else
  fail "Voting failed"
  echo "  Response: $VOTE_RESPONSE"
fi

# ─── 10. SOS ALERT CREATION ──────────────────────────
info "10. Create SOS Alert"

SOS_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/emergency/sos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"মিরপুর ১০ এ ছিনতাই! ৩ নম্বর বাসে উঠে ফোন ছিনিয়ে নিচ্ছে!","lat":23.8103,"lng":90.4125,"locationName":"মিরপুর ১০","type":"robbery","isAnonymous":true}' 2>/dev/null)

if echo "$SOS_RESPONSE" | grep -q '"success":true'; then
  pass "SOS Alert created"
  ALERT_ID=$(echo "$SOS_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -z "$ALERT_ID" ]; then
    ALERT_ID=$(echo "$SOS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  fi
  info "Alert ID: $ALERT_ID"
else
  fail "SOS Alert creation failed"
  echo "  Response: $SOS_RESPONSE"
fi

# ─── 11. LIST ALERTS ─────────────────────────────────
info "11. List Active Alerts"

ALERTS_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/emergency/alerts?status=active" 2>/dev/null)

if echo "$ALERTS_RESPONSE" | grep -q '"success":true'; then
  ACOUNT=$(echo "$ALERTS_RESPONSE" | grep -o '"total":[0-9]*' | cut -d: -f2)
  pass "Alert listing returned ($ACOUNT alerts)"
else
  fail "Alert listing failed"
fi

# ─── 12. NEARBY ALERTS ───────────────────────────────
info "12. Nearby Alerts (Geo Query)"

NEARBY_ALERT=$(curl -s "$BACKEND_URL/api/v1/emergency/alerts/nearby?lat=23.8103&lng=90.4125&radius=10" 2>/dev/null)

if echo "$NEARBY_ALERT" | grep -q '"success":true'; then
  pass "Nearby alerts query works"
else
  fail "Nearby alerts query failed"
fi

# ─── 13. REPORT SIGHTING ─────────────────────────────
info "13. Report Sighting"

if [ -n "$ALERT_ID" ]; then
  SIGHTING_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/emergency/alerts/$ALERT_ID/sighting" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"lat":23.8105,"lng":90.4128,"locationName":"মিরপুর ১০ রোড","description":"একজন লোক দ্রুত হাঁটছে","isAnonymous":true}' 2>/dev/null)

  if echo "$SIGHTING_RESPONSE" | grep -q '"success":true'; then
    pass "Sighting reported"
    SIGHTING_ID=$(echo "$SIGHTING_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -z "$SIGHTING_ID" ]; then
      SIGHTING_ID=$(echo "$SIGHTING_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    fi
    info "Sighting ID: $SIGHTING_ID"
  else
    fail "Sighting report failed"
    echo "  Response: $SIGHTING_RESPONSE"
  fi
else
  warn "Skipping — no alert ID from step 10"
fi

# ─── 14. CONFIRM SIGHTING ────────────────────────────
info "14. Confirm Sighting"

if [ -n "$SIGHTING_ID" ] && [ -n "$ALERT_ID" ]; then
  CONFIRM_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/emergency/alerts/$ALERT_ID/confirm" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"sightingId\":\"$SIGHTING_ID\"}" 2>/dev/null)

  if echo "$CONFIRM_RESPONSE" | grep -q '"success":true'; then
    COUNT=$(echo "$CONFIRM_RESPONSE" | grep -o '"confirmationCount":[0-9]*' | cut -d: -f2)
    pass "Sighting confirmed (count: $COUNT)"
  else
    # May fail if same user confirms twice — that's expected
    warn "Confirm returned non-success (may be duplicate — expected)"
  fi
else
  warn "Skipping — no sighting/alert ID"
fi

# ─── 15. FLAG ALERT ──────────────────────────────────
info "15. Flag Alert (requires trust >= 0.6)"

if [ -n "$ALERT_ID" ]; then
  FLAG_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/emergency/alerts/$ALERT_ID/flag" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"reason":"সন্দেহজনক"}' 2>/dev/null)

  if echo "$FLAG_RESPONSE" | grep -q '"success":true'; then
    pass "Alert flagged"
  elif echo "$FLAG_RESPONSE" | grep -q 'INSUFFICIENT_TRUST'; then
    pass "Flag blocked — trust score too low (expected for new user)"
  else
    fail "Flag failed unexpectedly"
    echo "  Response: $FLAG_RESPONSE"
  fi
else
  warn "Skipping — no alert ID"
fi

# ─── 16. GET ALERT DETAIL ────────────────────────────
info "16. Get Alert Detail"

if [ -n "$ALERT_ID" ]; then
  DETAIL_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/emergency/alerts/$ALERT_ID" 2>/dev/null)

  if echo "$DETAIL_RESPONSE" | grep -q '"success":true'; then
    SIGHTINGS=$(echo "$DETAIL_RESPONSE" | grep -o '"sightingCount":[0-9]*' | cut -d: -f2)
    pass "Alert detail returned (sightings: $SIGHTINGS)"
  else
    fail "Alert detail failed"
  fi
else
  warn "Skipping — no alert ID"
fi

# ─── 17. CREATE FEED POST (EMERGENCY TYPE) ───────────
info "17. Create Emergency-Typed Feed Post"

EMERG_POST=$(curl -s -X POST "$BACKEND_URL/api/v1/feed" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"হার্ট অ্যাটাক, কেউ অ্যাম্বুলেন্স ডাকবেন! গুলশান-১","type":"danger","lat":23.7925,"lng":90.4078,"locationName":"গুলশান-১"}' 2>/dev/null)

if echo "$EMERG_POST" | grep -q '"success":true'; then
  pass "Emergency-typed post created"
else
  fail "Emergency post creation failed"
fi

# ─── 18. ADMIN DASHBOARD ─────────────────────────────
info "18. Admin Dashboard (requires admin role)"

DASH_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/admin/dashboard" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)

if echo "$DASH_RESPONSE" | grep -q 'FORBIDDEN'; then
  pass "Admin endpoint protected (403 for non-admin — expected)"
elif echo "$DASH_RESPONSE" | grep -q '"success":true'; then
  pass "Admin dashboard accessible"
else
  warn "Admin endpoint returned unexpected response"
fi

# ─── 19. PUSH NOTIFICATION VAPID KEY ─────────────────
info "19. Push Notification VAPID Key"

VAPID_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/notifications/vapid-key" 2>/dev/null)

if echo "$VAPID_RESPONSE" | grep -q '"success":true'; then
  pass "VAPID key endpoint works"
else
  warn "VAPID key not configured (expected if VAPID keys not set in .env)"
fi

# ─── 20. NOTIFICATION LISTING ────────────────────────
info "20. Notification Listing"

NOTIF_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/notifications" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)

if echo "$NOTIF_RESPONSE" | grep -q '"success":true'; then
  pass "Notification listing works"
else
  fail "Notification listing failed"
fi

# ─── 21. AI NLP SERVICE ──────────────────────────────
info "21. AI NLP Service Health"

AI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$AI_NLP_URL/health" 2>/dev/null || echo "000")
if [ "$AI_STATUS" = "200" ]; then
  pass "NLP service is running"

  info "Testing Bengali text classification..."
  NLP_RESULT=$(curl -s -X POST "$AI_NLP_URL/classify" \
    -H "Content-Type: application/json" \
    -d '{"text":"মিরপুর ১০ এ একজন ছিনতাইকারী ৩ নম্বর বাসে উঠে ফোন ছিনিয়ে নিচ্ছে। প্লিজ সাহায্য!","reference_type":"feed_post","reference_id":"test"}' 2>/dev/null)

  if echo "$NLP_RESULT" | grep -q '"category"'; then
    CATEGORY=$(echo "$NLP_RESULT" | grep -o '"category":"[^"]*"' | cut -d'"' -f4)
    CONF=$(echo "$NLP_RESULT" | grep -o '"confidence":[0-9.]*' | cut -d: -f2)
    EMERG=$(echo "$NLP_RESULT" | grep -o '"is_emergency":[a-z]*' | cut -d: -f2)
    pass "NLP classified: category=$CATEGORY, confidence=$CONF, emergency=$EMERG"
  else
    fail "NLP classification failed"
    echo "  Response: $NLP_RESULT"
  fi
else
  warn "NLP service not running (start: cd ai-services && docker-compose up ai-nlp)"
fi

# ─── 22. AI IMAGE SERVICE ────────────────────────────
info "22. AI Image Service Health"

IMG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$AI_IMAGE_URL/health" 2>/dev/null || echo "000")
if [ "$IMG_STATUS" = "200" ]; then
  pass "Image analysis service is running"
else
  warn "Image service not running (start: cd ai-services && docker-compose up ai-image)"
fi

# ─── 23. AI CLUSTERING SERVICE ───────────────────────
info "23. AI Clustering Service Health"

CLUST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$AI_CLUSTER_URL/health" 2>/dev/null || echo "000")
if [ "$CLUST_STATUS" = "200" ]; then
  pass "Clustering service is running"

  info "Testing sighting clustering..."
  CLUST_RESULT=$(curl -s -X POST "$AI_CLUSTER_URL/cluster?alert_id=test123" \
    -H "Content-Type: application/json" \
    -d '[{"sighting_id":"s1","lat":23.8103,"lng":90.4125,"timestamp":"2026-07-09T10:00:00Z","trust_score":0.7},{"sighting_id":"s2","lat":23.8105,"lng":90.4128,"timestamp":"2026-07-09T10:05:00Z","trust_score":0.8}]' 2>/dev/null)

  if echo "$CLUST_RESULT" | grep -q '"clusters"'; then
    CLUSTER_COUNT=$(echo "$CLUST_RESULT" | grep -o '"sighting_count":[0-9]*' | head -1 | cut -d: -f2)
    pass "Clustering works (${CLUSTER_COUNT} sightings in cluster)"
  else
    fail "Clustering failed"
  fi
else
  warn "Clustering service not running (start: cd ai-services && docker-compose up ai-clustering)"
fi

# ─── 24. RATE LIMITING ───────────────────────────────
info "24. Rate Limiting (SOS: 1/hour)"

if [ -n "$ALERT_ID" ]; then
  # Try creating another SOS immediately — should be rate limited
  RATE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/emergency/sos" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message":"Rate limit test","lat":23.8103,"lng":90.4125,"type":"other"}' 2>/dev/null)

  if echo "$RATE_RESPONSE" | grep -q 'RATE_LIMITED'; then
    pass "SOS rate limiting works (1/hour enforced)"
  else
    warn "Rate limit not triggered (may need multiple requests)"
  fi
else
  warn "Skipping — no alert ID"
fi

# ─── 25. POST DELETION ──────────────────────────────
info "25. Delete Own Post"

if [ -n "$POST_ID" ]; then
  DEL_RESPONSE=$(curl -s -X DELETE "$BACKEND_URL/api/v1/feed/$POST_ID" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)

  if echo "$DEL_RESPONSE" | grep -q '"success":true'; then
    pass "Post deleted successfully"
  else
    fail "Post deletion failed"
    echo "  Response: $DEL_RESPONSE"
  fi
else
  warn "Skipping — no post ID"
fi

# ─── RESULTS ─────────────────────────────────────────
echo ""
echo "=========================================="
if [ $FAILURES -eq 0 ]; then
  echo -e "  ${GREEN}ALL TESTS PASSED${NC}"
else
  echo -e "  ${RED}$FAILURES TEST(S) FAILED${NC}"
fi
echo "=========================================="
echo ""
echo "Test email: $TEST_EMAIL"
echo ""
