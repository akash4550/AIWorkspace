# Architecture Deep Dive

## High-Level Request Flow
When a client makes a request, it passes through several layers of security and isolation before touching business logic.

```mermaid
sequenceDiagram
    participant Client
    participant LoadBalancer
    participant RateLimiter
    participant AuthMiddleware
    participant Controller
    participant Service
    participant Database

    Client->>LoadBalancer: HTTPS GET /api/v1/crm/opportunities
    LoadBalancer->>RateLimiter: Forward request
    RateLimiter->>AuthMiddleware: Validate IP rate limits
    AuthMiddleware->>AuthMiddleware: Verify JWT & extract organizationId
    AuthMiddleware->>Controller: req.user (Isolated Context)
    Controller->>Service: Get Opportunities (organizationId)
    Service->>Database: SELECT * FROM Opportunity WHERE orgId = ?
    Database-->>Service: Return isolated data
    Service-->>Client: 200 OK (JSON)
```

## Background Job Processing (BullMQ)
Heavy tasks are offloaded to Redis-backed queues to keep the HTTP API responsive.

```mermaid
flowchart LR
    API[API Server] -->|Enqueue Job| Redis[(Redis Queue)]
    Redis -->|Process Job| Worker[Worker Process]
    Worker -->|Save Results| DB[(PostgreSQL)]
    Worker -->|Emit Event| WebSockets[WebSocket Server]
    WebSockets -->|Notify| Client[React Client]
```

## Database Schema Highlights
The schema is built around the `Organization` to enforce multi-tenancy.

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER : contains
    ORGANIZATION ||--o{ PROJECT : owns
    ORGANIZATION ||--o{ CLIENT : manages
    PROJECT ||--o{ TASK : contains
    CLIENT ||--o{ OPPORTUNITY : has
```
