# Task API Backend

A learning-focused TypeScript backend project for practicing production-style backend patterns in a small task-management domain.

This is not positioned as a full task-management product. It is an open backend engineering lab that demonstrates how common API, database, authentication, authorization, caching, transactions, audit logging, and background-job patterns fit together in a real codebase.

## Why This Project Exists

Much of my production work lives in private organization repositories. This public repository gives recruiters, collaborators, and other learners a transparent code sample that shows how I think through backend structure and implementation tradeoffs.

The domain is intentionally familiar: users own tasks. The engineering focus is on the backend concepts around that domain.

## Backend Concepts Demonstrated

- REST API design with Express 5
- Route-level API versioning under `/api/v1`
- ESM-first TypeScript setup
- Route, controller, service, queue, and worker separation
- JWT authentication middleware
- bcrypt password hashing
- Authenticated `/api/v1/me` endpoint for frontend app bootstrapping
- Redis caching for stable user profile reads
- Versioned Redis caching for paginated task-list reads
- Ownership-based authorization for task access
- Task list pagination, filtering, sorting, and title search
- PostgreSQL persistence with Prisma
- Prisma migrations and relational modeling
- Zod request validation
- Optional task due dates
- Delayed reminder jobs for due or almost-due tasks
- Task ownership transfer inside a database transaction
- Transfer history with `TaskTransfer`
- General activity tracking with `AuditLog`
- Structured JSON request logging
- Request ID tracing with `x-request-id`
- In-memory HTTP metrics exposed through `/metrics`
- Health, readiness, liveness, and status endpoints
- Redis-backed background jobs with BullMQ
- Separate queues and workers for reports and reminders
- Environment-based configuration

## Tech Stack

| Area | Tooling |
| --- | --- |
| Runtime | Node.js |
| Language | TypeScript |
| HTTP server | Express 5 |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JSON Web Tokens |
| Password security | bcrypt |
| Validation | Zod |
| Cache | Redis with ioredis |
| Queue | BullMQ |
| Queue backing store | Redis |
| Dev runner | tsx |

## Architecture

```text
HTTP request
  -> route
  -> middleware
  -> controller
  -> service
  -> Prisma/PostgreSQL, Redis cache, or BullMQ/Redis
```

```text
src/
|-- controllers/   HTTP request and response handling
|-- services/      Business logic, data access, and cache-aware reads
|-- routes/        Express route registration
|   `-- v1/        Versioned public API routes mounted at /api/v1
|-- middleware/    Authentication, request ID, logging, and metrics middleware
|-- validators/    Zod request validation
|-- queues/        BullMQ queue definitions
|-- workers/       Background job processors
|-- lib/           Shared infrastructure clients, logger, and metrics utilities
`-- types/         TypeScript declaration merging
```

Redis is used in two ways:

- `redisConnectionOptions` provides shared Redis connection settings for BullMQ queues and workers.
- `redisCache` is an ioredis client used directly by services for cache commands such as `get`, `set`, and `del`.

More detail is available in [docs/architecture.md](docs/architecture.md).

## API Versioning

The public API is mounted under `/api/v1`:

```ts
app.use("/api/v1", v1Routes);
```

Versioning currently happens at the route boundary:

```text
src/routes/v1/
|-- authRoutes.ts
|-- meRoutes.ts
|-- taskRoutes.ts
`-- index.ts
```

Controllers, services, validators, queues, and workers remain shared implementation code. This avoids duplicating the whole application before a second API contract actually exists.

If a future `/api/v2` changes only route behavior, a new `src/routes/v2` folder can be added while reusing most controllers and services. If v2 requires different response shapes or business rules, only the affected controllers or services should be split.

## Observability

This project includes a small in-house observability layer to demonstrate common backend monitoring concepts without adding a full external observability stack yet.

### Structured Logging

`src/lib/logger.ts` provides a lightweight JSON logger with `info`, `warn`, and `error` levels. Request logs are emitted by `src/middleware/requestLogger.ts` after the response finishes.

Request logs include:

- `requestId`
- HTTP method
- request path
- response status code
- request duration in milliseconds
- user agent
- IP address

### Request ID Tracing

`src/middleware/requestId.ts` assigns every request a traceable request id.

If the client sends an `x-request-id` header, the API reuses it. Otherwise, the API generates a new UUID. The id is attached to `req.requestId`, included in structured request logs, and returned in the response header:

```http
x-request-id: <request-id>
```

This makes it easier to correlate a client-reported issue with the matching server-side logs.

### Metrics

`src/lib/metrics.ts` stores lightweight in-memory HTTP metrics. `src/middleware/requestMetrics.ts` records request counts, status code groups, and request duration statistics.

Metrics are exposed at:

```http
GET /metrics
```

The metrics endpoint currently returns JSON and resets when the server process restarts.

### Health and Readiness

Operational endpoints are mounted outside `/api/v1` because they are infrastructure endpoints, not versioned product API resources.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/ping` | Lightweight liveness check |
| `GET` | `/health` | Basic process health and uptime |
| `GET` | `/ready` | Readiness check for PostgreSQL and Redis |
| `GET` | `/status` | App metadata, environment, uptime, and API version |
| `GET` | `/metrics` | In-memory request metrics snapshot |

`/ready` returns `200` when required dependencies are available and `503` when the app is not ready to serve traffic.

## Core Domain

### User

A user can register, log in, retrieve their current profile through `/api/v1/me`, create tasks, own tasks, and transfer owned tasks to another user.

`GET /api/v1/me` is cached per user with a short Redis TTL because it is small, stable, and commonly requested during frontend app startup.

### Task

A task is owned by a user through `Task.userId`. Protected task reads and deletes are scoped to the authenticated user.

Task list responses use a `{ data, meta }` response shape. The list endpoint supports pagination, completion filtering, creation-date sorting, and title search.

Tasks can also include an optional `dueDate`. When a task has a due date, the API can queue a delayed reminder job to notify when the task is almost due.

Task-list reads are cached in Redis with keys that include user id, filters, search term, page, limit, and a per-user version number. Mutations such as create, update, delete, and transfer increment the version so stale list variants are ignored without deleting every possible cache key.

### TaskTransfer

A transfer record captures ownership movement from one user to another.

### AuditLog

An audit log records user actions at a broader system level. For example, a transfer can create both a `TaskTransfer` domain record and an `AuditLog` activity record.

### Report Jobs

Task reports are queued through BullMQ and processed by a separate report worker process. This keeps longer-running work outside the normal API request lifecycle.

### Reminder Jobs

Task reminders use a separate BullMQ queue and worker from report jobs. This keeps reminder processing independent from report generation, which is closer to how larger systems separate job domains.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then update the values for your local setup.

Required variables:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_app"
JWT_SECRET="replace-with-a-long-random-secret"
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

### 3. Configure PostgreSQL

Create a PostgreSQL database and make sure `DATABASE_URL` points to it.

### 4. Apply migrations

```bash
npx prisma migrate dev
```

### 5. Generate Prisma client

```bash
npm run prisma:generate
```

### 6. Start Redis

Redis is required for BullMQ jobs and `/api/v1/me` caching.

One quick Docker option:

```bash
docker run --name task-app-redis -p 6379:6379 -d redis:7-alpine
```

If Redis is already installed and running locally, no Docker command is needed.

### 7. Start the API

```bash
npm run dev
```

The API listens on:

```text
http://localhost:3000
```

### 8. Start workers

Run workers in separate terminals from the API.

Report worker:

```bash
npm run dev:worker
```

Reminder worker:

```bash
npm run dev:worker:reminders
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the API with file watching |
| `npm run dev:worker` | Run the BullMQ report worker with file watching |
| `npm run dev:worker:reminders` | Run the BullMQ reminder worker with file watching |
| `npm start` | Run the API once |
| `npm run worker` | Run the BullMQ report worker once |
| `npm run worker:reminders` | Run the BullMQ reminder worker once |
| `npm run prisma:generate` | Generate Prisma client types |
| `npm test` | Placeholder script; automated tests are not implemented yet |

## Authentication Flow

1. Register with email and password.
2. Log in with the same credentials.
3. Receive a JWT valid for one hour.
4. Send the token on protected routes:

```http
Authorization: Bearer <token>
```

## API Endpoints

Product API routes are versioned under `/api/v1`. Operational routes such as `/health`, `/ready`, and `/metrics` are intentionally mounted outside the versioned API namespace.

### Auth

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Create a user account |
| `POST` | `/api/v1/auth/login` | Authenticate and return a JWT |

### Current User

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/v1/me` | Return the authenticated user, using Redis cache when available |

### Tasks

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/v1/tasks` | List tasks for the authenticated user |
| `GET` | `/api/v1/tasks/:id` | Fetch one owned task |
| `POST` | `/api/v1/tasks` | Create a task and optionally schedule a reminder |
| `PATCH` | `/api/v1/tasks/:id` | Update one owned task |
| `DELETE` | `/api/v1/tasks/:id` | Delete one owned task |
| `POST` | `/api/v1/tasks/:id/transfer` | Transfer an owned task to another user |

### Reports

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/v1/tasks/reports` | Queue a background task report job |
| `GET` | `/api/v1/tasks/reports/:jobId` | Check the BullMQ report job status |

## Request Examples

### Register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"recruiter-demo@example.com","password":"strong-password"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"recruiter-demo@example.com","password":"strong-password"}'
```

Example response:

```json
{
  "message": "Login successful",
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "recruiter-demo@example.com"
  }
}
```

### Fetch Current User

```bash
curl http://localhost:3000/api/v1/me \
  -H "Authorization: Bearer <jwt>"
```

The service checks Redis first using a per-user key, then falls back to PostgreSQL and stores the result with a short TTL.

### Create a Task

```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"title":"Prepare backend portfolio notes","completed":false}'
```

### Create a Task With a Due Date

```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"title":"Submit report","completed":false,"dueDate":"2026-06-01T09:00:00.000Z"}'
```

When a due date is present, the API can enqueue a delayed reminder job. The reminder worker processes jobs from `reminder-queue`.

### List Tasks

```bash
curl http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer <jwt>"
```

Supported query parameters:

| Query | Example | Behavior |
| --- | --- | --- |
| `completed` | `/api/v1/tasks?completed=true` | Filter by completion state |
| `sort` | `/api/v1/tasks?sort=createdAt` | Sort tasks by creation time |
| `search` | `/api/v1/tasks?search=report` | Search task titles |
| `page` | `/api/v1/tasks?page=2` | Select result page |
| `limit` | `/api/v1/tasks?limit=10` | Limit results per page, max 100 |

Example list response:

```json
{
  "data": [
    {
      "id": 1,
      "title": "Submit report",
      "completed": false
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Update a Task

```bash
curl -X PATCH http://localhost:3000/api/v1/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"title":"Submit final report","completed":true}'
```

### Transfer a Task

```bash
curl -X POST http://localhost:3000/api/v1/tasks/1/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"recipientEmail":"teammate@example.com"}'
```

Only the current owner can transfer a task. The transfer updates the task owner, writes a transfer history record, and writes an audit log record inside one transaction.

### Queue a Report Job

```bash
curl -X POST http://localhost:3000/api/v1/tasks/reports \
  -H "Authorization: Bearer <jwt>"
```

Example response:

```json
{
  "message": "Report generation started",
  "jobId": "1",
  "statusUrl": "/api/v1/tasks/reports/1"
}
```

### Check Report Job Status

```bash
curl http://localhost:3000/api/v1/tasks/reports/1 \
  -H "Authorization: Bearer <jwt>"
```

## Operational Endpoint Examples

### Ping

```bash
curl http://localhost:3000/ping
```

### Health

```bash
curl http://localhost:3000/health
```

### Readiness

```bash
curl http://localhost:3000/ready
```

### Status

```bash
curl http://localhost:3000/status
```

### Metrics

```bash
curl http://localhost:3000/metrics
```

## Validation and Error Handling

Task creation is validated with Zod before controller logic runs. The API also returns explicit errors for cases such as:

- Missing credentials
- Duplicate registration attempts
- Invalid login credentials
- Missing or malformed bearer tokens
- Invalid or expired JWTs
- Unknown task identifiers
- Invalid task filters, search, pagination, or sort parameters
- Invalid request payloads
- Unauthorized transfer attempts
- Unknown report job ids

## Security and Ownership Notes

- Passwords are stored as bcrypt hashes.
- Authenticated routes rely on JWT verification middleware.
- Task reads and deletes are constrained by authenticated user id.
- Task transfer requires the authenticated user to be the current owner.
- Tokens are issued with a one-hour expiration window.
- `/api/v1/me` returns selected user fields and does not expose password hashes.
- `/api/v1/me` cache keys are scoped by authenticated user id to avoid cross-user data leaks.
- Task-list cache keys include authenticated user id and query parameters to avoid cross-user or cross-query data leaks.
- Request IDs are returned in `x-request-id` response headers and included in request logs.

## Current Limitations

This repository is intentionally evolving. Current gaps include:

- Automated tests are not implemented yet.
- Report jobs currently demonstrate background processing but do not persist report files or results to a report table.
- Reminder jobs currently demonstrate delayed processing, but do not yet persist notification delivery history.
- Task due-date updates do not yet cancel and reschedule old reminder jobs.
- Error handling is still controller-local rather than centralized.
- Docker Compose is not added yet for full PostgreSQL and Redis provisioning.
- OpenAPI documentation is not added yet.
- Metrics are in-memory and reset when the server restarts.
- `/metrics` is public in this learning setup; production systems usually expose metrics only on private networks or behind access controls.

## Roadmap and Contributing

See [ROADMAP.md](ROADMAP.md) for planned backend learning milestones.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution notes.

## License

ISC


