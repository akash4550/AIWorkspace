# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copy root package.json if using workspaces, else just api's
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies (ignoring scripts for speed/security)
RUN npm ci --ignore-scripts --workspace=api --include-workspace-root=false

COPY apps/api ./apps/api

# Generate Prisma Client
WORKDIR /app/apps/api
RUN npm run generate

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

# Install production dependencies only
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci --omit=dev --ignore-scripts --workspace=api --include-workspace-root=false

# Copy built artifacts from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/node_modules/@prisma ./apps/api/node_modules/@prisma
COPY --from=builder /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Start the application
CMD ["node", "dist/server.js"]
