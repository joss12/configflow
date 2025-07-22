# Multi-stage build for ConfigFlow
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for TypeScript)
RUN npm ci && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S configflow && \
    adduser -S configflow -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create necessary directories
RUN mkdir -p .configflow/data .configflow/logs .configflow/backups && \
    chown -R configflow:configflow /app

# Switch to non-root user
USER configflow

# Expose health check port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV CONFIGFLOW_METRICS_INTERVAL=10000
ENV CONFIGFLOW_SAFETY_MODE=true
ENV CONFIGFLOW_RISK_THRESHOLD=low

# Start the application
CMD ["node", "dist/index.js"]
