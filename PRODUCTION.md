# AIWorkspace Production Guide

Welcome to the production guide for AIWorkspace. This document outlines the critical operational aspects of running the platform in a production environment.

## 1. Environment Configuration

The application **will fail to start** if the following environment variables are missing in production:
- `DATABASE_URL`: Connection string for PostgreSQL 15+.
- `JWT_SECRET`: Must be at least 16 characters.
- `FRONTEND_URL`: Used to strict-match CORS policies.
- `NODE_ENV`: Must be set to `production`.

*Note: Redis is optional for local development but highly recommended in production for job queues.*

## 2. Deployment (Docker Compose)

We provide a `docker-compose.production.yml` that defines the entire stack.

To deploy on a single node (e.g., EC2, DigitalOcean Droplet):
```bash
docker-compose -f docker-compose.production.yml up -d --build
```
This will start:
1. Postgres Database
2. Redis Cache/Queue
3. API Server (Port 4000)
4. Worker Process (Background Jobs)
5. Nginx Web Server (Port 80)

## 3. Observability

### Logging
The API utilizes `winston` for structured JSON logging.
In production, all logs are streamed to `stdout` in JSON format. Your infrastructure (e.g., Datadog agent, Fluentd, CloudWatch) should capture `stdout` and index it.

### Health Probes (Kubernetes Ready)
- **Liveness:** `GET /api/v1/system/live` - Returns 200 immediately. Use this to restart stalled containers.
- **Readiness:** `GET /api/v1/system/ready` - Returns 200 only if Postgres and Redis are reachable. Use this for Load Balancer routing.

## 4. Security
- **Rate Limiting:** The API is globally limited to 100 requests per 15 minutes per IP.
- **Headers:** Helmet is configured to block XSS, MIME-sniffing, and clickjacking.
- **CORS:** Only the exact `FRONTEND_URL` is allowed to make Cross-Origin requests.

## 5. Backups
You must configure automated volume snapshots for the `pgdata` volume, or ideally use a managed database service (AWS RDS, Google Cloud SQL) for point-in-time recovery.
