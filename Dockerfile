# Build stage for any Node.js build requirements
FROM node:18-alpine AS builder

WORKDIR /build

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies if needed
RUN if [ -f "pnpm-lock.yaml" ]; then \
        npm install -g pnpm && pnpm install --frozen-lockfile; \
    elif [ -f "package-lock.json" ]; then \
        npm ci; \
    elif [ -f "package.json" ]; then \
        npm install; \
    fi

# Copy source files
COPY . .

# Build if needed (skip if no build script)
RUN if [ -f "package.json" ] && grep -q '"build"' package.json; then \
        npm run build || true; \
    fi

# Final stage - PocketBase runtime
FROM alpine:3.19

# Install dependencies
RUN apk add --no-cache \
    ca-certificates \
    unzip \
    wget \
    curl \
    bash

# Download and install PocketBase
ARG PB_VERSION=0.22.20
RUN wget -O /tmp/pb.zip https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip /tmp/pb.zip -d /usr/local/bin/ \
    && chmod +x /usr/local/bin/pocketbase \
    && rm /tmp/pb.zip

# Create app directory
WORKDIR /pb

# Copy built files from builder stage
COPY --from=builder /build/public /pb/pb_public
COPY --from=builder /build/pb_migrations /pb/pb_migrations
COPY --from=builder /build/pb_hooks /pb/pb_hooks

# Copy entrypoint script
COPY scripts/docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Create data directory
RUN mkdir -p /pb/pb_data

# Expose port
EXPOSE 8090

# Set environment variables
ENV PB_DATA_DIR=/pb/pb_data \
    PB_PUBLIC_DIR=/pb/pb_public \
    PB_MIGRATIONS_DIR=/pb/pb_migrations \
    PB_HOOKS_DIR=/pb/pb_hooks \
    PB_PORT=8090

# Volume for persistent data
VOLUME ["/pb/pb_data"]

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8090/api/health || exit 1

# Run entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]