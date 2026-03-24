# GoBron Backend

NestJS + Prisma backend for GoBron project.

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL (or Supabase Postgres)
- Docker (optional, for quick local Postgres)

## Environment setup

1. Create `.env` from `.env.example`.
2. Fill all required variables, especially:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TELEGRAM_BOT_TOKEN`

## Install

```bash
npm install
```

## Database setup

### Option A: Local Postgres via Docker

```bash
docker compose up -d
```

Then run:

```bash
npm run db:push
npm run prisma:generate
```

### Option B: Existing Postgres / Supabase

If this is a fresh database, run:

```bash
npm run db:push
npm run prisma:generate
```

If you manage schema changes via migrations, run:

```bash
npm run db:migrate
npm run prisma:generate
```

## Run project

Development:

```bash
npm run start:dev
```

Production:

```bash
npm run build
npm run start:prod
```

## Swagger

After app starts:

- API base: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/docs`

## Quality checks

```bash
npm run lint
npm run build
npm test
npm run test:e2e
```
