# Task API

A TypeScript REST API for authenticated task management, built with Express 5, PostgreSQL, Prisma, JWT authentication, bcrypt password hashing, and Zod request validation.

This repository is intentionally small in surface area but structured like a production backend rather than a tutorial-only CRUD sample. It demonstrates:

- ESM-first TypeScript configuration with `tsx`
- Layered routing, controller, middleware, and validator modules
- JWT-protected user and task endpoints
- PostgreSQL persistence through Prisma and the `@prisma/adapter-pg` driver adapter
- Request validation before controller execution
- Per-user task ownership checks on reads and deletes
- Query-driven filtering and sorting for task retrieval

## Tech Stack

| Area | Tooling |
| --- | --- |
| Runtime | Node.js with ESM modules |
| Language | TypeScript |
| HTTP server | Express 5 |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JSON Web Tokens |
| Password security | bcrypt |
| Validation | Zod |
| Dev runner | tsx |

## Project Structure

```text
.
|-- prisma/
|   |-- migrations/
|   `-- schema.prisma
|-- src/
|   |-- controllers/
|   |   |-- authController.ts
|   |   |-- meController.ts
|   |   `-- taskController.ts
|   |-- middleware/
|   |   `-- auth.ts
|   |-- routes/
|   |   |-- authRoutes.ts
|   |   |-- meRoutes.ts
|   |   `-- taskRoutes.ts
|   |-- types/
|   |   `-- express.d.ts
|   |-- validators/
|   |   `-- task.validator.ts
|   `-- app.ts
|-- prismaClient.ts
|-- prisma.config.ts
|-- package.json
`-- tsconfig.json
```

## Core Domain

### User

- `id`
- `email`
- `password`
- `createdAt`

### Task

- `id`
- `userId`
- `title`
- `completed`
- `createdAt`

Each task belongs to a user. Protected task queries are scoped to the authenticated user rather than operating globally.

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_app"
JWT_SECRET="replace-with-a-long-random-secret"
```

`DATABASE_URL` is consumed by both Prisma configuration and the runtime Prisma client. `JWT_SECRET` is required for signing and verifying access tokens.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure PostgreSQL

Create a PostgreSQL database and make sure `DATABASE_URL` points to it.

### 3. Apply database migrations

```bash
npx prisma migrate dev
```

### 4. Generate the Prisma client

```bash
npm run prisma:generate
```

### 5. Start the API

Development mode:

```bash
npm run dev
```

Run once:

```bash
npm start
```

The API listens on:

```text
http://localhost:3000
```

## Authentication Flow

1. Register a user with email and password.
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

### Fetch the Current User

```bash
curl http://localhost:3000/me \
  -H "Authorization: Bearer <jwt>"
```

## Validation and Error Handling

Task creation is validated with Zod before controller logic runs:

```json
{
  "title": "At least 3 characters",
  "completed": false
}
```

The API returns explicit error responses for cases such as:

- Missing credentials
- Duplicate registration attempts
- Invalid login credentials
- Missing or malformed bearer tokens
- Invalid or expired JWTs
- Unknown task identifiers
- Invalid task filters or sort parameters
- Invalid request payloads

## Security and Ownership Notes

- Passwords are stored as bcrypt hashes.
- Authenticated routes rely on JWT verification middleware.
- Task reads and deletes are constrained by both task id and authenticated user id.
- Tokens are issued with a one-hour expiration window.
- The API avoids returning raw password values in authentication responses.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the API with file watching |
| `npm start` | Run the API once |
| `npm run prisma:generate` | Generate Prisma client types |
| `npm test` | Placeholder script; automated tests are not implemented yet |

## Why This Repository Exists

Much of my day-to-day production work lives in private organization repositories. This public project is meant to provide a transparent code sample that still demonstrates practical backend concerns:

- database-backed API design
- authentication middleware
- data ownership boundaries
- validation before persistence
- TypeScript module configuration
- Prisma-backed relational modeling

## Current Scope and Roadmap

Implemented:

- User registration and login
- JWT-protected user lookup
- Task creation, retrieval, filtering, and deletion
- PostgreSQL persistence with Prisma migrations
- Initial request validation

Good next extensions:

- Automated tests for auth middleware, validation, and task ownership
- Update task endpoint
- Refresh token or session lifecycle improvements
- Centralized error middleware
- OpenAPI or Postman/Insomnia collection
- Docker Compose for local PostgreSQL provisioning

## License

ISC
