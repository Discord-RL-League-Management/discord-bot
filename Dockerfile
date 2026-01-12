# Builder stage
FROM node:24-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code and configuration files
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only (ignore scripts since husky is dev-only)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy build artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Switch to non-root user
USER nodejs

# Expose port (default 3001, configurable via BOT_PORT env var)
EXPOSE 3001

# Start the application
CMD ["node", "dist/main"]
