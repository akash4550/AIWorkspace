# AIWorkspace Production Runbook

This runbook covers the RC1 single-node Docker Compose deployment defined by `docker-compose.production.yml`.

## 1. Production Architecture

The production topology contains:

- **PostgreSQL 15** for persistent application data.
- **Redis 7** for queues, caching, and realtime infrastructure.
- **Migration service** that runs `prisma migrate deploy` before API startup.
- **API service** containing the HTTP API, Socket.IO server, scheduled jobs, and BullMQ workers.
- **Web service** running the compiled React application behind Nginx.

The API does not start unless:

1. PostgreSQL is healthy.
2. All committed Prisma migrations complete successfully.
3. Redis is healthy.

The web service does not start until the API readiness check passes.

> RC1 runs background workers and scheduled jobs inside the API process. Run only one API replica until worker leadership or a separate worker service is implemented.

## 2. Host Prerequisites

The deployment host requires:

- Docker Engine
- Docker Compose v2
- Git
- Adequate persistent storage for Docker volumes
- A DNS name and TLS termination for internet-facing deployments
- An external backup destination

Only ports required by the deployment should be publicly reachable.

- Expose the public web endpoint through ports 80 and 443.
- Restrict direct access to the API port with the host firewall.
- Do not expose PostgreSQL or Redis publicly.

The included Nginx container serves HTTP. Use a load balancer, ingress controller, or host reverse proxy for TLS termination.

## 3. Environment Configuration

Create the production environment file:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Replace every placeholder before deployment.

Required secrets:

- `DB_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Both JWT secrets must:

- contain at least 32 characters
- be different from each other
- be generated from a cryptographically secure source

Database and Redis passwords are interpolated into connection URLs. Use URL-safe characters unless the Compose configuration is changed to encode credentials.

For non-loopback deployments, `FRONTEND_URL` must:

- use HTTPS
- contain only the public origin
- contain no path, credentials, query string, or fragment

Valid example:

```text
https://app.example.com
```

Invalid examples:

```text
http://app.example.com
https://user:password@app.example.com
https://app.example.com/dashboard
```

Never commit `.env.production`.

## 4. Validate Configuration

Validate environment interpolation and Compose syntax before building:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  config --quiet
```

A successful command produces no output and exits with status `0`.

Review the rendered service configuration when diagnosing interpolation issues:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  config
```

Do not publish the rendered output because it contains secrets.

## 5. Build Production Images

Build the API and web images:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  build api web
```

The resulting local images are:

- `aiworkspace-api`
- `aiworkspace-web`

The migration service uses the same image as the API.

## 6. Initial Deployment

Start the complete topology:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  up -d --no-build --wait postgres redis api web
```

Compose automatically starts the migration dependency before the API.

Inspect service state:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  ps -a
```

A successful deployment shows:

- PostgreSQL: `healthy`
- Redis: `healthy`
- Migration service: `Exited (0)`
- API: `healthy`
- Web: `healthy`

Verify the migration output:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  logs migrate
```

The migration logs must show that all migrations were applied or that no pending migrations exist.

## 7. Post-Deployment Verification

Load the environment values into the current shell:

```bash
set -a
. ./.env.production
set +a
```

Verify the web application:

```bash
curl --fail --silent --show-error \
  "http://127.0.0.1:${WEB_PORT:-80}/"
```

Verify API liveness through Nginx:

```bash
curl --fail --silent --show-error \
  "http://127.0.0.1:${WEB_PORT:-80}/api/v1/system/live"
```

Verify dependency readiness through Nginx:

```bash
curl --fail --silent --show-error \
  "http://127.0.0.1:${WEB_PORT:-80}/api/v1/system/ready"
```

A successful readiness response reports:

- `status` as `ready`
- `database` as `connected`
- `redis` as `connected`

External monitoring and load balancers should use:

```text
GET /api/v1/system/ready
```

Container restart policies should use the Docker health checks already defined in Compose.

## 8. Deploying an Update

Create and verify a database backup before deploying changes that include migrations.

Pull the approved revision:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
```

Validate the production environment:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  config --quiet
```

Build updated images:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  build api web
```

Ensure PostgreSQL and Redis are running:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  up -d --no-build --wait postgres redis
```

Remove the previous completed migration container:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  rm -f migrate
```

Run the new migrations as a blocking release gate:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  up --no-build migrate
```

Do not continue when the migration command exits unsuccessfully.

Start the updated API and web services:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  up -d --no-build --wait api web
```

Repeat the post-deployment verification checks.

## 9. Logs and Diagnostics

Display service status:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  ps -a
```

Follow API and web logs:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  logs --follow api web
```

Inspect migration failures:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  logs migrate postgres
```

Inspect Redis failures:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  logs redis api
```

Application logs are written to standard output. Production infrastructure should collect container logs into a durable centralized logging system.

## 10. Database Backups

Load the production environment into the shell:

```bash
set -a
. ./.env.production
set +a
```

Create a backup directory:

```bash
mkdir -p backups
chmod 700 backups
```

Create a PostgreSQL custom-format backup:

```bash
BACKUP_FILE="backups/aiworkspace-$(date -u +%Y%m%dT%H%M%SZ).dump"

docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  exec -T postgres \
  pg_dump \
    --username "$DB_USER" \
    --dbname "$DB_NAME" \
    --format custom \
  > "$BACKUP_FILE"
```

Validate that the backup can be read:

```bash
cat "$BACKUP_FILE" |
  docker compose \
    --env-file .env.production \
    -f docker-compose.production.yml \
    exec -T postgres \
    pg_restore --list >/dev/null
```

Copy backups to storage outside the deployment host. A backup stored only on the same host is not sufficient disaster recovery.

Use managed PostgreSQL point-in-time recovery when available.

## 11. Database Restore

A restore is destructive. Test the procedure in a non-production environment before relying on it.

Stop application traffic and background processing:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  stop api web
```

Recreate the database:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  exec -T postgres \
  dropdb --username "$DB_USER" --if-exists "$DB_NAME"

docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  exec -T postgres \
  createdb --username "$DB_USER" "$DB_NAME"
```

Restore the selected backup:

```bash
cat backups/SELECTED_BACKUP.dump |
  docker compose \
    --env-file .env.production \
    -f docker-compose.production.yml \
    exec -T postgres \
    pg_restore \
      --username "$DB_USER" \
      --dbname "$DB_NAME" \
      --no-owner \
      --no-privileges
```

Start the application and verify readiness:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  up -d --no-build --wait api web
```

## 12. Rollback Policy

Prisma migrations are forward-only in the automated deployment path.

Do not attempt to reverse a production migration by deleting migration records or manually editing the Prisma migration table.

An application rollback is safe only when the previous application version is compatible with the current database schema.

For a code-only rollback:

1. Check out the last approved commit.
2. Rebuild the API and web images.
3. Start the API and web services.
4. Verify readiness and critical user journeys.

When a database migration is not backward-compatible:

1. Stop application traffic.
2. Restore the database backup taken before deployment.
3. Deploy the matching application revision.
4. Verify readiness before reopening traffic.

## 13. Staging Smoke Test

The repository includes an end-to-end production-image smoke test.

The fixture command creates a fixed test organization and user. Run it only against a disposable local or staging database.

Never run this command against a live production database:

```bash
npm run smoke:prepare-auth
```

For a disposable environment:

```bash
npm run smoke:prepare-auth

SMOKE_WEB_URL="http://127.0.0.1:${WEB_PORT:-80}" \
  npm run smoke:production
```

The smoke test verifies:

- production web assets
- absence of localhost API dependencies in the browser bundle
- API readiness through Nginx
- Socket.IO proxying
- login, refresh, `/me`, and logout
- React rendering in a headless browser

## 14. Safe Shutdown

Stop the deployment while preserving data:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  down
```

Do not add `--volumes` during a normal shutdown.

The following command permanently deletes the local PostgreSQL and Redis volumes and must only be used for intentional environment destruction:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  down --volumes
```

## 15. Persistent Data

Docker Compose manages these volumes:

- `postgres_data`
- `redis_data`

PostgreSQL is the authoritative persistent data store.

Redis persistence supports queues and cache recovery but is not a substitute for PostgreSQL backups.

Monitor available disk capacity and configure automated backup retention before accepting production traffic.
