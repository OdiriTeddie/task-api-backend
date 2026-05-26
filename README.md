# Task API Backend

A learning-focused TypeScript backend project for practicing production-style backend patterns in a small task-management domain.

This is not positioned as a full task-management product. It is an open backend engineering lab that demonstrates how common API, database, authentication, authorization, transaction, audit, and background-job patterns fit together in a real codebase.

## Why This Project Exists

Much of my production work lives in private organization repositories. This public repository gives recruiters, collaborators, and other learners a transparent code sample that shows how I think through backend structure and implementation tradeoffs.

The domain is intentionally familiar: users own tasks. The engineering focus is on the backend concepts around that domain.

## Backend Concepts Demonstrated

- REST API design with Express 5
- ESM-first TypeScript setup
- Route, controller, service, queue, and worker separation
- JWT authentication middleware
- bcrypt password hashing
- Authenticated `/me` endpoint for frontend app bootstrapping
- Ownership-based authorization for task access
- PostgreSQL persistence with Prisma
- Prisma migrations and relational modeling
- Zod request validation
- Task ownership transfer inside a database transaction
- Transfer history with `TaskTransfer`
- General activity tracking with `AuditLog`
- Redis-backed background jobs with BullMQ
- Separate worker process for report generation
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
  -> Prisma/PostgreSQL or BullMQ/Redis
```

```text
src/
|-- controllers/   HTTP request and response handling
|-- services/      Business logic and database operations
|-- routes/        Express route registration
|-- middleware/    Authentication middleware
|-- validators/    Zod request validation
|-- queues/        BullMQ queue definitions
|-- workers/       Background job processors
|-- lib/           Shared infrastructure clients
`-- types/         TypeScript declaration merging
```

More detail is available in [docs/architecture.md](docs/architecture.md).

## Core Domain

### User

A user can register, log in, retrieve their current profile through `/me`, create tasks, own tasks, and transfer owned tasks to another user.

### Task

A task is owned by a user through `Task.userId`. Protected task reads and deletes are scoped to the authenticated user.

### TaskTransfer

A transfer record captures ownership movement from one user to another.

### AuditLog

An audit log records user actions at a broader system level. For example, a transfer can create both a `TaskTransfer` domain record and an `AuditLog` activity record.

### Report Jobs

Task reports are queued through BullMQ and processed by a separate worker process. This keeps longer-running work outside the normal API request lifecycle.

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

BullMQ needs Redis running before report jobs can be queued or processed.

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

### 8. Start the report worker

Run this in a second terminal:

```bash
npm run dev:worker
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the API with file watching |
| `npm run dev:worker` | Run the BullMQ report worker with file watching |
| `npm start` | Run the API once |
| `npm run worker` | Run the BullMQ report worker once |
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

### Auth

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create a user account |
| `POST` | `/auth/login` | Authenticate and return a JWT |

### Current User

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/me` | Return the authenticated user |

### Tasks

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/tasks` | List tasks for the authenticated user |
| `GET` | `/tasks/:id` | Fetch one owned task |
| `POST` | `/tasks` | Create a task |
| `DELETE` | `/tasks/:id` | Delete one owned task |
| `POST` | `/tasks/:id/transfer` | Transfer an owned task to another user |

### Reports

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/tasks/reports` | Queue a background task report job |
| `GET` | `/tasks/reports/:jobId` | Check the BullMQ report job status |

## Request Examples

### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"recruiter-demo@example.com","password":"strong-password"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
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

### Create a Task

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"title":"Prepare backend portfolio notes","completed":false}'
```

### List Tasks

```bash
curl http://localhost:3000/tasks \
  -H "Authorization: Bearer <jwt>"
```

Supported query parameters:

| Query | Example | Behavior |
| --- | --- | --- |
| `completed` | `/tasks?completed=true` | Filter by completion state |
| `sort` | `/tasks?sort=createdAt` | Sort tasks by creation time |

### Transfer a Task

```bash
curl -X POST http://localhost:3000/tasks/1/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"recipientEmail":"teammate@example.com"}'
```

Only the current owner can transfer a task. The transfer updates the task owner, writes a transfer history record, and writes an audit log record inside one transaction.

### Queue a Report Job

```bash
curl -X POST http://localhost:3000/tasks/reports \
  -H "Authorization: Bearer <jwt>"
```

Example response:

```json
{
  "message": "Report generation started",
  "jobId": "1",
  "statusUrl": "/tasks/reports/1"
}
```

### Check Report Job Status

```bash
curl http://localhost:3000/tasks/reports/1 \
  -H "Authorization: Bearer <jwt>"
```

## Validation and Error Handling

Task creation is validated with Zod before controller logic runs. The API also returns explicit errors for cases such as:

- Missing credentials
- Duplicate registration attempts
- Invalid login credentials
- Missing or malformed bearer tokens
- Invalid or expired JWTs
- Unknown task identifiers
- Invalid task filters or sort parameters
- Invalid request payloads
- Unauthorized transfer attempts
- Unknown report job ids

## Security and Ownership Notes

- Passwords are stored as bcrypt hashes.
- Authenticated routes rely on JWT verification middleware.
- Task reads and deletes are constrained by authenticated user id.
- Task transfer requires the authenticated user to be the current owner.
- Tokens are issued with a one-hour expiration window.
- `/me` returns selected user fields and does not expose password hashes.

## Current Limitations

This repository is intentionally evolving. Current gaps include:

- Automated tests are not implemented yet.
- Report jobs currently demonstrate background processing but do not persist report files or results to a report table.
- Error handling is still controller-local rather than centralized.
- Docker Compose is not added yet for full PostgreSQL and Redis provisioning.
- OpenAPI documentation is not added yet.

## Roadmap and Contributing

See [ROADMAP.md](ROADMAP.md) for planned backend learning milestones.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution notes.

## License

ISC
