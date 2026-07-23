<div align="center">
  <h1>🚀 AIWorkspace</h1>
  <p>A Production-Grade, Multi-Tenant Enterprise SaaS Platform</p>
</div>

<br />

AIWorkspace is a comprehensive, production-ready enterprise platform demonstrating advanced architectural patterns, strict multi-tenant data isolation, asynchronous processing, and modular monolith design. It is built to handle complex business workflows including Project Management, CRM, Real-time Document Collaboration, and AI Intelligence.

## ✨ Key Features
- **Strict Multi-Tenancy**: Data is securely isolated at the database and middleware layers, preventing cross-tenant leaks.
- **Modular Monolith Architecture**: The codebase is strictly partitioned into domain modules (`auth`, `crm`, `analytics`, `jobs`, `ai`, `search`) while maintaining a single robust deployment unit.
- **Asynchronous Background Processing**: Heavy operations (analytics, AI generation, email sending) are offloaded to Redis-backed BullMQ workers, ensuring the HTTP API remains lightning-fast.
- **Provider-Agnostic AI**: The AI Layer is built with an abstraction interface, preventing vendor lock-in and allowing seamless switching between OpenAI, Anthropic, or local models.
- **Global Search**: A unified, high-performance command palette (`Cmd+K`) searches across all authorized modules instantly.
- **Real-Time Collaboration**: WebSockets power live document editing and real-time notification streams.

## 🏗️ Technology Stack
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, BullMQ
- **Frontend:** React, TypeScript, Tailwind CSS, Tremor, React Query, Zustand, React Router
- **Database:** PostgreSQL (Primary Store), Redis (Caching, Queues, Pub/Sub)
- **DevOps:** Docker, GitHub Actions, Winston (Structured Logging), Zod (Environment Validation)

## 🚀 Quick Start (Local Development)
1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd aiworkspace
   npm install
   ```
2. **Start Infrastructure (Postgres & Redis)**
   ```bash
   docker-compose up -d
   ```
3. **Database Setup**
   ```bash
   npm run generate -w apps/api
   npm run db:push -w apps/api
   npm run seed -w apps/api
   ```
4. **Run the Application**
   ```bash
   npm run dev
   ```

## Deterministic Integration Tests

The integration suite uses dedicated Docker services on PostgreSQL port `55433` and Redis port `56379`.

```bash
# Start services and apply committed migrations
npm run test:infra:start

# Reset clean Docker volumes and reapply all migrations
npm run test:infra:reset

# Start services, migrate, and run the complete API suite
npm run test:integration

# Inspect or stop the dedicated test services
npm run test:infra:status
npm run test:infra:stop
```

The guarded migration command rejects non-local hosts and databases other than `aiworkspace_test`. CI uses the same migration path through `npm run test:db:migrate`.

## 📖 Documentation
- [Production & Deployment Guide](PRODUCTION.md)
- [Architecture Decision Record: Modular Monolith](ADR-001-Modular-Monolith.md)
- [Architecture Deep Dive](docs/architecture.md)
- [Local Development Setup](docs/local-development.md)

## 🔒 Security & Performance
- Rate limiting globally applied to prevent DoS.
- Helmet configured for strict HTTP security headers.
- Multi-stage Docker builds for minimal image size and secure attack surfaces.
- Kubernetes-ready `/system/live` and `/system/ready` health probes.
