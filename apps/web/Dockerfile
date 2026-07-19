# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci --ignore-scripts --workspace=web --include-workspace-root=false

COPY apps/web ./apps/web

WORKDIR /app/apps/web
# Set environment variables for production build
ENV NODE_ENV=production
# Assuming Vite build
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets to Nginx default public dir
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Use the reviewed production configuration for SPA and API/Socket.IO routing.
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
