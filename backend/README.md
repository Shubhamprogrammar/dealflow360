# Node Backend Starter

Node.js, Express, TypeScript, MongoDB, Redis, Socket.IO and BullMQ backend starter.

## Quick start

Requirements: Node 20+, MongoDB and Redis. Copy `.env.example` to `.env`, then run:

```bash
npm install
npm run dev
```

The API is under `/api/v1`; health is `/api/v1/health`, readiness is `/api/v1/ready`, and Swagger is `/docs`.

## Commands

`npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`, and `npm run format:check`.

Start MongoDB and Redis separately, then configure connection URLs in `.env`. Configure seed credentials only through environment variables.

See `ARCHITECTURE.md`, `API_GUIDELINES.md`, and `CONTRIBUTING.md` for operating conventions.
