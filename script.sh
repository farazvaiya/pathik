#!/bin/bash
# Pathik Full Setup Script — One command to rule them all

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Pathik — Full Setup Script        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"

# 1. Check Node.js
echo -e "\n${YELLOW}[1/6] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found! Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# 2. Install Backend Dependencies
echo -e "\n${YELLOW}[2/6] Installing backend dependencies...${NC}"
cd backend
npm install --silent
if [ $? -ne 0 ]; then
    echo -e "${RED}Backend install failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# 3. Install Frontend Dependencies
echo -e "\n${YELLOW}[3/6] Installing frontend dependencies...${NC}"
cd ../frontend
npm install --silent
if [ $? -ne 0 ]; then
    echo -e "${RED}Frontend install failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# 4. Create .env file
echo -e "\n${YELLOW}[4/6] Creating .env file...${NC}"
cd ../backend

# Generate secure random keys
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
DEVICE_ID_SECRET=$(openssl rand -hex 16)
ENCRYPTION_KEY=$(openssl rand -hex 32)

cat > .env << EOF
# Server
NODE_ENV=development
PORT=5000
PATHIK_PUBLIC_URL=http://localhost:5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/pathik

# JWT
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Auth
AUTH_MAX_ATTEMPTS=5
AUTH_LOCK_MINUTES=15
BCRYPT_COST=10
ANONYMOUS_MODE=1
DEVICE_ID_COOKIE_SECRET=${DEVICE_ID_SECRET}

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5000

# AI Provider (default: groq — free at groq.com)
PATHIK_AI_PROVIDER=groq
GROQ_API_KEY=
OPENROUTER_API_KEY=
NVIDIA_API_KEY=

# Supabase (optional — for Hybrid RAG)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
USE_HYBRID_SEARCH=false

# Feature flags
PATHIK_ENABLE_ROUTE_WRITES=0

# Email (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=Pathik <noreply@pathik.app>

# Monitoring
SENTRY_DSN=
LOG_LEVEL=info
EOF

echo -e "${GREEN}✓ .env file created with secure keys${NC}"

# 5. Check MongoDB
echo -e "\n${YELLOW}[5/6] Checking MongoDB...${NC}"
if command -v mongosh &> /dev/null; then
    mongosh --eval "db.adminCommand('ping')" --quiet 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ MongoDB is running locally${NC}"
    else
        echo -e "${YELLOW}⚠ MongoDB not running locally${NC}"
        echo -e "${YELLOW}  Start it: sudo systemctl start mongod${NC}"
        echo -e "${YELLOW}  Or set MONGODB_URI in .env to Atlas URL${NC}"
    fi
else
    echo -e "${YELLOW}⚠ mongosh not found — skipping MongoDB check${NC}"
    echo -e "${YELLOW}  Make sure MongoDB is running or set MONGODB_URI in .env${NC}"
fi

# 6. Done!
echo -e "\n${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     ✅ Setup Complete!                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo -e ""
echo -e "${GREEN}To start the app:${NC}"
echo -e "  ${CYAN}Terminal 1:${NC} cd backend && npm run dev"
echo -e "  ${CYAN}Terminal 2:${NC} cd frontend && npm run dev"
echo -e ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Get a free Groq API key: https://console.groq.com"
echo -e "  2. Add it to backend/.env: GROQ_API_KEY=your_key"
echo -e "  3. Open http://localhost:5173 in your browser"
echo -e ""
