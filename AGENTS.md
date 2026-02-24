# AGENTS.md — Coding Agent Instructions for Axion

> This file instructs AI coding agents operating in this repository.
> Read AXION.md for full architecture spec. Read STYLE-GUIDE.md for UI/UX rules.

## Project Overview

Axion is a unified college student portal (PWA) that proxies outdated college APIs
and presents data through a fast, modern interface. Monorepo with a React SPA frontend
and a Bun + Hono API backend following clean architecture.

## Tech Stack

- **Runtime**: Bun (never Node.js for the app; attendance-cli.js is a legacy PoC)
- **Package manager**: bun (never npm/yarn/pnpm)
- **Frontend**: React 19, Vite, Tanstack Router, Tanstack Query, Zustand, Tailwind CSS v4, shadcn/ui
- **Backend**: Hono (Bun), Drizzle ORM, PostgreSQL 16, Redis 7, BullMQ, Better Auth
- **Monorepo**: Turborepo with bun workspaces
- **Validation**: Zod (shared between frontend and backend)
- **Testing**: Vitest
- **Linting/Formatting**: Biome

## Build / Lint / Test Commands

```bash
# Install all dependencies
bun install

# Dev servers
bun run --filter web dev          # Frontend (Vite)
bun run --filter api dev          # Backend (Hono)

# Build
bun run --filter web build        # Frontend production build
bun run --filter api build        # Backend build

# Lint & format (Biome)
bun run lint                      # Lint all packages
bun run format                    # Format all packages

# Database
bun run --filter api db:migrate   # Run Drizzle migrations
bun run --filter api db:seed      # Seed colleges table

# Infrastructure
docker-compose up -d              # Start Postgres + Redis

# Tests
bun run test                      # Run all tests across monorepo
bun run --filter api test         # Run API tests only
bun run --filter web test         # Run frontend tests only
bunx vitest run src/path/to/file.test.ts              # Single test file
bunx vitest run -t "test name"                        # Single test by name
bunx vitest run --reporter=verbose src/path/to/file   # Verbose single file

# shadcn components (run from apps/web)
bunx shadcn@latest add button     # Add a component — never install @shadcn/ui directly
```

## Architecture — Clean Architecture (Backend)

Strict layer dependency: Domain → Application → Interface Adapters → Infrastructure.
Inner layers NEVER import from outer layers.

- **Domain** (`apps/api/src/domain/`): Pure TS entities, value objects, errors. Zero external imports.
- **Application** (`apps/api/src/application/`): Use cases, port interfaces (repository/service contracts).
- **Infrastructure** (`apps/api/src/infrastructure/`): Drizzle repos, Redis cache, BullMQ workers, college adapters, Better Auth, encryption.
- **HTTP** (`apps/api/src/http/`): Hono routes, controllers, middleware.

## Monorepo Structure

```
apps/web/src/features/<name>/     # Feature modules (components/, hooks/, lib/)
apps/web/src/components/          # Shared UI components
apps/api/src/domain/              # Entities, value objects, errors
apps/api/src/application/         # Use cases and port interfaces
apps/api/src/infrastructure/      # Concrete implementations
apps/api/src/http/                # Hono routes + controllers
packages/shared/src/schemas/      # Zod schemas (API contracts)
packages/shared/src/types/        # Shared TypeScript types
```

## Code Style

### Naming Conventions
- **Files**: `kebab-case.ts` / `kebab-case.tsx` (e.g., `attendance-card.tsx`, `use-attendance.ts`)
- **Components**: PascalCase, named exports only (never default exports; exception: route files)
- **Props**: Interface with `Props` suffix (`AttendanceCardProps`)
- **Hooks**: `use-<name>.ts` → `useAttendance()`
- **Tests**: `<name>.test.ts` or `<name>.test.tsx`
- **Branches**: `feat/<name>`, `fix/<name>`
- **Commits**: Conventional — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`

### TypeScript
- Strict mode enabled. No `any` unless absolutely unavoidable.
- Use Zod schemas as the single source of truth; infer types with `z.infer<>`.
- Prefer `interface` for component props. Use `type` for unions/intersections.

### Imports
- Absolute imports with `@/` path alias (e.g., `import { cn } from '@/lib/utils'`).
- Import individual icons from `lucide-react` — never the barrel export.
- Shared schemas imported from `@axion/shared`.

### Error Handling
- Domain errors are custom typed classes in `apps/api/src/domain/errors/`.
- Use cases return errors as values (Result pattern) or throw domain errors — never raw strings.
- HTTP layer catches domain errors and maps to proper status codes in error-handler middleware.
- Frontend: Tanstack Query `onError` + toast notifications via Sonner.

## Styling — Hard Rules

**NEVER** do any of the following:
- Hardcode colors (`bg-[#1a1a2e]`, `text-[rgb(...)]`, `bg-gray-900`, `bg-white`, `bg-black`)
- Use CSS modules, styled-components, or emotion
- Use `!important`
- Use arbitrary pixel values for spacing (`p-[13px]`)
- Use `px` for font sizes in CSS
- Use template literals for conditional classes — always use `cn()`

**ALWAYS** do:
- Use CSS variable semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `text-destructive`)
- Use Tailwind's spacing scale (`p-4`, `gap-6`, not `p-[17px]`)
- Use `cn()` from `@/lib/utils` for conditional classes
- Use `tabular-nums` on all numeric data displays
- Use `font-mono` for course codes and technical identifiers
- Use `tracking-tight` on headings

### Dark Mode
- Dark is the default theme. Every component must work in both light and dark mode.
- All theming via CSS variables in `:root` and `.dark` — never inline color values.

## Component Requirements

Every data-displaying component MUST have:
1. **Loading state** — Skeleton placeholders (never blank screens, never spinner-only)
2. **Empty state** — Illustration + message + CTA
3. **Error state** — Alert with retry action

Use shadcn/ui components for all standard patterns (Button, Card, Table, Dialog, Badge, etc.).
Add them via CLI: `bunx shadcn@latest add <component>`.

## College Adapter Pattern

Each college adapter implements the `CollegeAdapter` interface:
```
login(credentials) → CollegeAuthResult
getAttendance(auth) → AttendanceRecord[]
getTimetable(auth) → TimetableEntry[]
getMarks(auth) → MarkRecord[]
getCourses(auth) → CourseRecord[]
```

Adapters live in `apps/api/src/infrastructure/college-adapters/<slug>/`.
Each has `__tests__/fixtures/` with recorded API responses for deterministic unit tests.

## Testing

- Use Vitest for all tests. No Jest.
- College adapters: test parsing/mapping against recorded JSON fixtures.
- Repositories: integration tests with Testcontainers (real Postgres/Redis).
- API routes: Hono test client with mocked use cases.
- Frontend: component tests with Vitest + Testing Library (future).
- Credentials, tokens, and secrets must never appear in test fixtures — use dummy values.

## Security Notes

- College credentials are AES-256-GCM encrypted before storage. Never log plaintext credentials.
- Do not commit `.env` files. Use `.env.example` with placeholder values only.
- Sensitive fields: `encrypted_username`, `encrypted_password`, `encryption_iv`, `college_token`.
