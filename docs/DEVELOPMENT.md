# Local Development Setup

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Bun** | >= 1.1 | `curl -fsSL https://bun.sh/install \| bash` |
| **Docker** + **Docker Compose** | any recent | [docs.docker.com](https://docs.docker.com/get-docker/) |
| **Git** | any recent | — |

> **Do not** use npm, yarn, or pnpm. This project uses Bun exclusively.

---

## 1. Clone & Install

```bash
git clone <repo-url> axion
cd axion
bun install
```

This installs dependencies for all workspaces (`apps/api`, `apps/web`, `packages/shared`).

---

## 2. Start Infrastructure (Postgres + Redis)

```bash
docker compose up -d
```

This starts:

- **PostgreSQL 16** on `localhost:5432` (user: `axion`, password: `password`, db: `axion`)
- **Redis 7** on `localhost:6379`

Verify they're running:

```bash
docker compose ps
```

---

## 3. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

### Generate secrets

```bash
# Better Auth secret (32-byte random string)
openssl rand -base64 32

# Credential encryption key (32-byte key as 64 hex chars)
openssl rand -hex 32
```

Paste the outputs into `BETTER_AUTH_SECRET` and `CREDENTIAL_ENCRYPTION_KEY` respectively.

### Google OAuth credentials

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Create a new **OAuth 2.0 Client ID** (application type: Web application)
3. Add **Authorized JavaScript origin**: `http://localhost:5173`
4. Add **Authorized redirect URI**: `http://localhost:3000/api/auth/callback/google`
5. Copy the Client ID and Client Secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### VAPID keys (optional — for push notifications)

```bash
bunx web-push generate-vapid-keys
```

Copy the public and private keys into `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`. These can be left blank during development if you don't need push notifications.

### Verify your `.env`

At minimum, these must be set for the app to start:

```
DATABASE_URL=postgresql://axion:password@localhost:5432/axion
REDIS_URL=redis://localhost:6379
BETTER_AUTH_SECRET=<generated>
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from-google>
GOOGLE_CLIENT_SECRET=<from-google>
CREDENTIAL_ENCRYPTION_KEY=<generated>
FRONTEND_URL=http://localhost:5173
```

---

## 4. Database Setup

### Run migrations

```bash
bun run --filter api db:migrate
```

This applies all Drizzle migrations in `apps/api/src/infrastructure/database/migrations/`.

### Seed the colleges table

```bash
bun run --filter api db:seed
```

This inserts the NCU (The NorthCap University) college record. The operation is idempotent — safe to run multiple times.

### (Optional) Explore the database

```bash
bun run --filter api db:studio
```

Opens [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview) at `https://local.drizzle.studio` for browsing tables.

---

## 5. Start Dev Servers

Run both servers in separate terminals:

```bash
# Terminal 1 — API (Hono on Bun, port 3000)
bun run --filter api dev

# Terminal 2 — Frontend (Vite, port 5173)
bun run --filter web dev
```

Or run everything via Turborepo (output interleaved):

```bash
bun run dev
```

Once both are running:

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- The Vite dev server proxies all `/api/*` requests to the backend automatically.

---

## 6. Usage Flow

1. Open http://localhost:5173 — you'll see the login page.
2. Click **Continue with Google** to sign in via OAuth.
3. After sign-in, you land on the **Dashboard** (empty state until you link a college).
4. Go to **Settings** (via the sidebar on desktop, or the "More" menu on mobile).
5. Click **Link College**, select "The NorthCap University", enter your college portal credentials, and submit.
6. The backend encrypts your credentials, stores them, and triggers a sync job.
7. Once the sync completes, your **Attendance**, **Timetable**, **Marks**, and **Courses** pages will populate with data.
8. You can trigger a manual re-sync from Settings at any time.

---

## 7. Common Commands

### Build

```bash
# Build everything
bun run build

# Build individual packages
bun run --filter web build
bun run --filter api build
```

### Lint & Format

```bash
# Lint all packages (Biome)
bun run lint

# Format all packages
bun run format
```

### Type Check

```bash
bun run check-types
```

### Tests

```bash
# All tests
bun run test

# API tests only
bun run --filter api test

# Single test file
bunx vitest run apps/api/src/infrastructure/college-adapters/ncu/__tests__/ncu.adapter.test.ts

# Verbose single test
bunx vitest run --reporter=verbose apps/api/src/path/to/file.test.ts
```

### Database

```bash
# Generate a new migration after schema changes
bun run --filter api db:generate

# Apply pending migrations
bun run --filter api db:migrate

# Push schema directly (skips migration files — dev only)
bun run --filter api db:push

# Open Drizzle Studio
bun run --filter api db:studio

# Re-seed colleges
bun run --filter api db:seed
```

### Add a shadcn/ui component

```bash
# Run from apps/web
bunx shadcn@latest add <component-name>
```

---

## 8. Project Structure

```
axion/
├── apps/
│   ├── api/                 # Hono + Bun backend
│   │   └── src/
│   │       ├── domain/      # Entities, errors, value objects (pure TS)
│   │       ├── application/ # Use cases, port interfaces
│   │       ├── infrastructure/
│   │       │   ├── database/       # Drizzle schema, repos, migrations, seed
│   │       │   ├── cache/          # Redis client
│   │       │   ├── auth/           # Better Auth config
│   │       │   ├── encryption/     # AES-256-GCM credential vault
│   │       │   ├── college-adapters/  # NCU adapter (+ future colleges)
│   │       │   └── jobs/           # BullMQ workers, queues, scheduler
│   │       ├── http/        # Routes, controllers, middleware, DI container
│   │       └── index.ts     # Entry point
│   └── web/                 # React 19 + Vite SPA
│       └── src/
│           ├── components/  # Shared UI (shadcn/ui + layout)
│           ├── features/    # Feature modules (auth, dashboard, attendance, etc.)
│           ├── lib/         # Utilities (api-client, auth-client, query-keys)
│           ├── stores/      # Zustand stores
│           ├── routes/      # TanStack Router file-based routes
│           └── index.css    # Tailwind v4 theme tokens
├── packages/
│   ├── shared/              # Zod schemas, types, constants (shared by api + web)
│   └── typescript-config/   # Base tsconfig presets
├── docker-compose.yml       # Postgres + Redis
├── turbo.json               # Turborepo task config
└── biome.json               # Linter + formatter config
```

---

## 9. Troubleshooting

### "Cannot find module '@/...'" errors in your editor

These are transient LSP workspace resolution issues. The project builds and runs correctly. Try restarting your TypeScript language server (`Ctrl+Shift+P` > "TypeScript: Restart TS Server" in VS Code).

### Port already in use

```bash
# Find what's using port 3000 or 5173
lsof -i :3000
lsof -i :5173

# Kill it
kill -9 <PID>
```

### Docker containers won't start

```bash
# Check logs
docker compose logs postgres
docker compose logs redis

# Reset volumes (destroys data)
docker compose down -v
docker compose up -d
```

### Migration fails

Make sure Postgres is running and `DATABASE_URL` in `.env` is correct:

```bash
docker compose ps          # should show postgres as "running"
bun run --filter api db:migrate
```

### Redis connection errors on API start

The API requires Redis to be running before it starts (BullMQ connects eagerly). Make sure `docker compose up -d` completed and Redis is healthy:

```bash
docker compose ps
redis-cli ping              # should return PONG
```

### Google OAuth redirect mismatch

Ensure your Google Cloud Console OAuth client has exactly these:

- **Authorized JavaScript origin**: `http://localhost:5173`
- **Authorized redirect URI**: `http://localhost:3000/api/auth/callback/google`
