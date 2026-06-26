# Architecture Notes

This project uses a simple layered backend structure.

## Request Flow

```text
HTTP request
  -> route
  -> middleware
  -> controller
  -> service
  -> repository
  -> Prisma/PostgreSQL or BullMQ/Redis
```

## Controllers

Controllers translate HTTP concerns into application calls. They read `req`, call a service or queue, and send a response.

## Services

Services contain business logic, cache orchestration, operation flow, and transaction coordination. They should not depend on Express `Request` or `Response` objects.

## Repositories

Repositories isolate Prisma-backed database access from service logic. Services call repositories for persistence operations instead of building every Prisma query inline.

The repository layer is being introduced incrementally. The task list read path now delegates list/count queries to `task.repository.ts`, while the rest of the task service can be migrated in smaller follow-up steps.

## Workers

Workers process asynchronous jobs outside the API request lifecycle. The report worker consumes BullMQ jobs from Redis.

## Current Domain Concepts

- `User`: authenticated account.
- `Task`: work item owned by a user through `Task.userId`.
- `TaskTransfer`: transfer history for ownership changes.
- `AuditLog`: general activity trail for system events.
- Report jobs: asynchronous task summary generation through BullMQ.
