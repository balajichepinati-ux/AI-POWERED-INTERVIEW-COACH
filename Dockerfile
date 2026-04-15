FROM node:20-alpine

# Install base dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy backend
COPY backend/ ./backend/
COPY .env ./backend/.env

WORKDIR /app/backend

# Install backend dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start backend
CMD ["npm", "start"]
