# TaskFlow Scalability Note

## Current Architecture

```text
React client -> Nginx/Vite proxy -> Express API -> PostgreSQL
                                      |
                                      +-> optional Redis / future cache layer
```

Today, the project is a modular monolith. That is the right tradeoff for a small team or internship assignment because it keeps delivery fast, avoids premature operational complexity, and still leaves clear seams for scale.

## Why The Current Shape Scales Well

- Stateless API requests using JWT access tokens
- PostgreSQL connection pooling through `pg`
- Versioned route structure for clean API evolution
- Clear module boundaries across routes, validators, controllers, and models
- Request IDs and structured logs for debugging under load
- Dockerized deployment path for consistent environments

## Scale-Up Path

### 1. Horizontal API scaling

Because the API is stateless, multiple instances can run behind a load balancer without sticky sessions.

```text
Client -> Load Balancer -> API-1
                        -> API-2
                        -> API-N
                             |
                             -> PostgreSQL primary
```

This is the first step once one instance starts hitting CPU or connection limits.

### 2. Redis for hot reads and throttling

Redis is the natural next infrastructure addition once read traffic or bursty auth traffic justifies it:

- task-list caching
- per-user dashboard stats caching
- rate-limit storage
- refresh-token deny lists or high-speed session invalidation

Example cache keys:

- `tasks:user:{userId}:{filtersHash}`
- `stats:user:{userId}`
- `admin:users:{page}:{filtersHash}`

### 3. Read replicas and query split

Once reads dominate writes, list and analytics endpoints should move to read replicas:

- `GET /api/v1/tasks`
- `GET /api/v1/tasks/stats`
- `GET /api/v1/admin/users`

The API layer can expose `queryRead` and `queryWrite` helpers so controllers stay clean while the database topology grows.

### 4. Background jobs for slow work

If the product grows to include notifications, exports, webhooks, or analytics aggregation, those should move off the request path into workers backed by Redis or a message broker.

Good queue candidates:

- welcome emails
- audit/event fan-out
- daily digest generation
- scheduled reminder notifications

## Database Scaling

### Indexing

The schema already indexes the highest-value filters:

- `tasks.user_id`
- `tasks.status`
- `tasks.priority`
- `users.email`
- `refresh_tokens.user_id`

As data grows, composite indexes such as `(user_id, status)` or `(user_id, due_date)` become strong next candidates depending on query patterns.

### Pooling

With multiple API instances, introduce PgBouncer so connection count does not grow linearly with the number of Node processes.

### Partitioning

If task volume becomes very large, `tasks` can be partitioned by:

- creation month for retention-heavy workloads
- `user_id` hash for evenly distributed tenant access

## Service Extraction Plan

The current codebase can evolve into services without a rewrite:

```text
auth routes/controllers/models  -> auth-service
task routes/controllers/models  -> task-service
admin routes/controllers/models -> admin-service
```

That transition should happen only when team size, scaling pressure, or deployment independence justifies it.

## Production Readiness Upgrades

### Observability

Recommended stack:

- logs: Winston -> CloudWatch / ELK
- metrics: Prometheus + Grafana
- tracing: OpenTelemetry
- alerting: PagerDuty / Grafana Alerts

Key metrics:

- p95 and p99 latency
- auth failure rate
- refresh-token rotation volume
- DB pool saturation
- cache hit ratio

### Infrastructure

Recommended production path:

- container registry for API and frontend images
- managed PostgreSQL
- managed Redis
- load balancer in front of multiple API instances
- CI/CD pipeline with smoke checks and migration step

## Security At Scale

Security choices that help once traffic grows:

- short-lived access tokens reduce long-tail risk
- hashed refresh tokens avoid storing raw long-lived credentials
- request IDs make abuse and incident tracing easier
- rate limiting protects auth endpoints from brute-force traffic
- server-side revocation of refresh tokens supports session invalidation

## Bottom Line

TaskFlow is intentionally built as a clean, scalable monolith: simple enough to ship fast, but structured enough to grow into a high-traffic system with caching, replicas, workers, and eventually service extraction if needed.
