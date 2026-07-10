# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --ignore-scripts
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --ignore-scripts
COPY backend/ ./
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Copy backend build output
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/package.json ./backend/
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules

# Copy backend data files (routes.json, metro.json)
COPY --from=backend-build /app/backend/routes.json ./backend/
COPY --from=backend-build /app/backend/metro.json ./backend/

# Copy frontend build output (backend serves from ../../dist relative to server.js)
COPY --from=frontend-build /app/dist ./dist

# Set working directory to backend (where server.js runs)
WORKDIR /app/backend

EXPOSE 5000

CMD ["node", "dist/server.js"]
