# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci --ignore-scripts

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

# Add a custom nginx configuration to handle React Router client-side routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root   /usr/share/nginx/html; \
        index  index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
