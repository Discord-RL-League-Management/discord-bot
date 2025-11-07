# Stage 1: Build shared-types package
FROM node:20-alpine AS build-shared-types
WORKDIR /app/packages/shared-types

# Copy shared-types package files
COPY packages/shared-types/package*.json ./
COPY packages/shared-types/tsconfig.json ./
COPY packages/shared-types/src ./src

# Install dependencies and build
RUN npm ci && npm run build

# Stage 2: Build Discord bot
FROM node:20-alpine AS build-bot
WORKDIR /app

# Copy built shared-types package from Stage 1
COPY --from=build-shared-types /app/packages/shared-types ./packages/shared-types

# Copy discord-bot package files
COPY discord-bot/package*.json ./discord-bot/
COPY discord-bot/tsconfig.json ./discord-bot/
COPY discord-bot/src ./discord-bot/src

# Install dependencies and build
WORKDIR /app/discord-bot
RUN npm ci && npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built shared-types package from Stage 1 (only package.json and dist/)
COPY --from=build-shared-types /app/packages/shared-types/package*.json ./packages/shared-types/
COPY --from=build-shared-types /app/packages/shared-types/dist ./packages/shared-types/dist

# Copy built bot files from Stage 2
COPY --from=build-bot /app/discord-bot/dist ./discord-bot/dist
COPY --from=build-bot /app/discord-bot/package*.json ./discord-bot/

# Install only production dependencies
WORKDIR /app/discord-bot
RUN npm ci --only=production && npm cache clean --force

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Start the bot
CMD ["npm", "run", "start:prod"]

