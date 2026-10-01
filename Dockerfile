# Production Multi-Stage Dockerfile for NearPin Platform

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: Production Backend Server ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy backend source & built frontend assets
COPY backend ./backend
COPY --from=frontend-builder /app/dist ./public-dist

EXPOSE 5000
CMD ["node", "backend/src/server.js"]
