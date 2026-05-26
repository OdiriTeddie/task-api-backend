# Contributing

This project is primarily a learning-focused backend repository, but suggestions, issues, and improvements are welcome.

## Development Notes

- Keep controllers focused on HTTP request and response handling.
- Put business logic and database operations in services.
- Keep workers separate from the API process.
- Prefer small, focused pull requests that explain the backend concept being added or improved.
- Do not commit `.env`, credentials, database dumps, or generated dependency folders.

## Useful Commands

```bash
npm install
npx prisma migrate dev
npm run dev
npm run dev:worker
```

Run TypeScript checks before opening a pull request:

```bash
npx tsc --noEmit
```
