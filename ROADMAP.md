# Roadmap

This repository is a backend learning project. The roadmap tracks backend concepts worth practicing rather than product features alone.

## Short Term

- Add centralized error handling and custom error classes.
- Add Zod validation for auth, transfer, and report request payloads.
- Rename `transferTrask` to `transferTaskToUser`.
- Add tests for auth, task ownership, and transfer transactions.
- Persist generated report results instead of logging them only.

## Medium Term

- Add Docker Compose for PostgreSQL and Redis.
- Add OpenAPI documentation for the REST endpoints.
- Add report status/result endpoints backed by database records.
- Add pagination for task lists.
- Add task update endpoint and audit logging for update/delete/create actions.

## Longer Term

- Add role-based access control for admin reporting.
- Add refresh-token or session lifecycle improvements.
- Add structured logging.
- Add CI checks for TypeScript, linting, tests, and Prisma validation.
