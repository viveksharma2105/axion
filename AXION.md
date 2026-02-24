# AXION — Unified College Portal for Students

> A modern, unified student portal that replaces outdated college management systems with a fast, clean, and reliable experience.

---

## 1. Vision & Problem Statement

### Problem
Most Indian college portals (like NCU's MyCampus) are:
- Painfully slow and unreliable
- Built on outdated tech with terrible UX
- Mobile-unfriendly
- Frequently down during peak hours (exam results, attendance checks)

Students check attendance, timetables, and marks **multiple times daily** and deserve a better experience.

### Solution
**Axion** is a unified student portal that:
- Proxies and caches data from existing college APIs
- Presents it through a fast, modern, mobile-first interface
- Works offline via PWA
- Sends proactive alerts (attendance dropping, new marks posted)
- Supports multiple colleges through a plugin adapter system

### First College
**NCU India** (The NorthCap University) — APIs already reverse-engineered from `mycampus.ncuindia.edu`.

---

## 2. Target Users

**Students only** (v1). Students use Axion to:
- View attendance summary and trends
- Check class timetable / schedule
- View internal marks and semester grades
- Browse registered courses and faculty info
- Receive alerts when attendance drops below college threshold

No faculty or admin roles in v1.

---

## 3. Core Features (v1 — Polished Launch)

### 3.1 Authentication & Account Management
- **Axion Account**: Google OAuth via [Better Auth](https://www.better-auth.com/)
- **College Linking**: After Axion login, students link their college portal credentials
- College credentials are **encrypted at rest** (AES-256-GCM) and stored in the database
- Students can unlink/re-link college accounts at any time
- Session management with secure HTTP-only cookies

### 3.2 Attendance Module
- Subject-wise attendance summary (present, absent, LOA, on-duty, percentage)
- **Attendance trend chart** — percentage over time (line/area chart)
- **Projected final percentage** — based on current trend
- **Classes needed calculator** — "You need X more classes to reach Y%"
- Attendance threshold configured **per college** in the adapter
- Alerts when attendance drops below threshold

### 3.3 Timetable / Schedule Module
- Daily and weekly class schedule view
- Current/next class highlight
- Room/location information (if available from API)

### 3.4 Marks / Grades Module
- Internal marks (assignments, quizzes, mid-terms)
- Semester results and SGPA/CGPA (if available from API)
- Subject-wise breakdown

### 3.5 Course Catalog Module
- List of registered courses for current semester
- Course code, name, credits, faculty name
- Section/batch information

### 3.6 Notifications
- **In-app notifications** — notification bell with unread count
- **PWA push notifications** — via Web Push API / service workers
- Notification triggers:
  - Attendance drops below college-defined threshold
  - New marks/grades posted
  - Timetable changes detected
  - Sync failures (college API down)

### 3.7 PWA (Advanced)
- Installable on home screen (Android/iOS)
- **Offline data caching** — last synced data available offline via IndexedDB
- **Background sync** — queued actions sync when connectivity returns
- Share target support
- App-like navigation with bottom nav bar

---

## 4. Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Cloudflare Pages                    │
│              (React SPA + PWA Shell)                 │
│                                                     │
│  React 19 · Tanstack Router · Tanstack Query        │
│  Zustand · Tailwind CSS · shadcn/ui                 │
└──────────────────────┬──────────────────────────────┘
                       │ Hono RPC (type-safe)
                       ▼
┌─────────────────────────────────────────────────────┐
│              DigitalOcean Droplet ($16/mo)           │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │           Bun + Hono API Server              │    │
│  │                                              │    │
│  │  Routes → Controllers → Use Cases → Repos    │    │
│  │                                              │    │
│  │  Better Auth · College Adapters · BullMQ     │    │
│  └──────────┬──────────────┬────────────────────┘    │
│             │              │                         │
│  ┌──────────▼───┐  ┌──────▼──────┐                  │
│  │  PostgreSQL   │  │    Redis    │                  │
│  │  (Drizzle)    │  │  (Cache +   │                  │
│  │               │  │   BullMQ)   │                  │
│  └───────────────┘  └─────────────┘                  │
└─────────────────────────────────────────────────────┘
                       │
                       ▼ (Background Sync)
┌─────────────────────────────────────────────────────┐
│              College APIs (External)                 │
│                                                     │
│  NCU India API · [Future colleges...]               │
└─────────────────────────────────────────────────────┘
```

### 4.2 Clean Architecture Layers

The backend follows **Clean Architecture** with strict dependency rules (inner layers never depend on outer layers):

```
┌─────────────────────────────────────────┐
│  Infrastructure (outermost)             │
│  - Hono routes & middleware             │
│  - Drizzle ORM repositories            │
│  - Redis cache implementation           │
│  - BullMQ job processors               │
│  - College API adapters                 │
│  - Better Auth config                   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Interface Adapters             │    │
│  │  - Controllers                  │    │
│  │  - Presenters / DTOs            │    │
│  │  - Repository interfaces        │    │
│  │                                 │    │
│  │  ┌─────────────────────────┐    │    │
│  │  │  Application (Use Cases)│    │    │
│  │  │  - GetAttendance        │    │    │
│  │  │  - LinkCollege          │    │    │
│  │  │  - SyncStudentData      │    │    │
│  │  │  - GetTimetable         │    │    │
│  │  │  - GetMarks             │    │    │
│  │  │  - GetCourses           │    │    │
│  │  │  - CheckAlerts          │    │    │
│  │  │                         │    │    │
│  │  │  ┌─────────────────┐    │    │    │
│  │  │  │  Domain (core)  │    │    │    │
│  │  │  │  - Entities     │    │    │    │
│  │  │  │  - Value Objects│    │    │    │
│  │  │  │  - Errors       │    │    │    │
│  │  │  └─────────────────┘    │    │    │
│  │  └─────────────────────────┘    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Layer rules:**
- **Domain**: Pure TypeScript. No imports from any other layer. Contains entities (`Student`, `Attendance`, `Course`, `Mark`, `Timetable`), value objects, and custom error types.
- **Application**: Use cases that orchestrate domain logic. Depends only on domain. Defines repository/service interfaces (ports).
- **Interface Adapters**: Controllers that translate HTTP requests to use case inputs. Presenters that format use case outputs for the API.
- **Infrastructure**: Concrete implementations of all interfaces. Drizzle repos, Redis cache, Hono routes, college adapters, BullMQ workers.

---

## 5. Tech Stack

### 5.1 Frontend (SPA)
| Concern | Technology |
|---------|-----------|
| Framework | React 19 |
| Routing | Tanstack Router |
| Data fetching | Tanstack Query |
| Client state | Zustand |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Validation | Zod (shared with backend) |
| API client | Hono RPC client |
| PWA | Workbox (service worker toolkit) |
| Build tool | Vite |
| Charts | Recharts or Chart.js |
| Hosting | Cloudflare Pages (free) |

### 5.2 Backend (API)
| Concern | Technology |
|---------|-----------|
| Runtime | Bun |
| Framework | Hono |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Job queue | BullMQ |
| Auth | Better Auth |
| Validation | Zod |
| Encryption | Node.js `crypto` (AES-256-GCM) |
| Hosting | DigitalOcean Droplet ($16/mo) |

### 5.3 Shared
| Concern | Technology |
|---------|-----------|
| Monorepo | Turborepo |
| Package manager | bun |
| Language | TypeScript (strict mode) |
| Validation schemas | Zod (shared package) |
| Testing | Vitest |
| Linting | ESLint + Biome |
| Formatting | Biome |

---

## 6. Monorepo Structure

```
axion/
├── apps/
│   ├── web/                          # React SPA (Vite)
│   │   ├── public/
│   │   │   ├── manifest.json         # PWA manifest
│   │   │   └── sw.js                 # Service worker entry
│   │   ├── src/
│   │   │   ├── app/                  # App shell, providers, layout
│   │   │   ├── features/             # Feature-based modules
│   │   │   │   ├── auth/             # Login, Google OAuth
│   │   │   │   ├── dashboard/        # Main dashboard
│   │   │   │   ├── attendance/       # Attendance views + charts
│   │   │   │   ├── timetable/        # Schedule views
│   │   │   │   ├── marks/            # Marks / grades views
│   │   │   │   ├── courses/          # Course catalog
│   │   │   │   ├── notifications/    # Notification center
│   │   │   │   └── settings/         # Account, college linking
│   │   │   ├── components/           # Shared UI components
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── lib/                  # Utilities, API client
│   │   │   ├── stores/               # Zustand stores
│   │   │   └── routes/               # Tanstack Router route definitions
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── api/                          # Bun + Hono API
│       ├── src/
│       │   ├── domain/               # Entities, value objects, errors
│       │   │   ├── entities/
│       │   │   │   ├── student.ts
│       │   │   │   ├── attendance.ts
│       │   │   │   ├── course.ts
│       │   │   │   ├── mark.ts
│       │   │   │   ├── timetable.ts
│       │   │   │   └── notification.ts
│       │   │   ├── value-objects/
│       │   │   └── errors/
│       │   │
│       │   ├── application/          # Use cases + port interfaces
│       │   │   ├── use-cases/
│       │   │   │   ├── auth/
│       │   │   │   ├── attendance/
│       │   │   │   ├── timetable/
│       │   │   │   ├── marks/
│       │   │   │   ├── courses/
│       │   │   │   ├── sync/
│       │   │   │   └── notifications/
│       │   │   └── ports/            # Repository & service interfaces
│       │   │       ├── repositories/
│       │   │       └── services/
│       │   │
│       │   ├── infrastructure/       # Concrete implementations
│       │   │   ├── database/
│       │   │   │   ├── schema.ts     # Drizzle schema
│       │   │   │   ├── migrations/
│       │   │   │   └── repositories/ # Drizzle repository implementations
│       │   │   ├── cache/
│       │   │   │   └── redis.ts      # Redis cache implementation
│       │   │   ├── auth/
│       │   │   │   └── better-auth.ts
│       │   │   ├── encryption/
│       │   │   │   └── credential-vault.ts  # AES-256-GCM encryption
│       │   │   ├── jobs/
│       │   │   │   ├── queue.ts      # BullMQ setup
│       │   │   │   ├── sync-worker.ts
│       │   │   │   └── notification-worker.ts
│       │   │   └── college-adapters/
│       │   │       ├── adapter.interface.ts  # CollegeAdapter interface
│       │   │       ├── registry.ts           # Adapter registry
│       │   │       └── ncu/                  # NCU India adapter
│       │   │           ├── ncu.adapter.ts
│       │   │           ├── ncu.config.ts
│       │   │           ├── ncu.types.ts
│       │   │           └── __tests__/
│       │   │               ├── ncu.adapter.test.ts
│       │   │               └── fixtures/     # Recorded API responses
│       │   │
│       │   ├── http/                 # Hono routes + controllers
│       │   │   ├── routes/
│       │   │   │   ├── auth.routes.ts
│       │   │   │   ├── attendance.routes.ts
│       │   │   │   ├── timetable.routes.ts
│       │   │   │   ├── marks.routes.ts
│       │   │   │   ├── courses.routes.ts
│       │   │   │   └── notifications.routes.ts
│       │   │   ├── controllers/
│       │   │   ├── middleware/
│       │   │   │   ├── auth.middleware.ts
│       │   │   │   ├── rate-limit.middleware.ts
│       │   │   │   └── error-handler.ts
│       │   │   └── app.ts            # Hono app setup
│       │   │
│       │   └── index.ts              # Entry point
│       │
│       ├── drizzle.config.ts
│       └── tsconfig.json
│
├── packages/
│   └── shared/                       # Shared types, schemas, constants
│       ├── src/
│       │   ├── schemas/              # Zod schemas (API contracts)
│       │   │   ├── auth.schema.ts
│       │   │   ├── attendance.schema.ts
│       │   │   ├── timetable.schema.ts
│       │   │   ├── marks.schema.ts
│       │   │   ├── courses.schema.ts
│       │   │   └── notifications.schema.ts
│       │   ├── types/                # Shared TypeScript types
│       │   └── constants/            # Shared constants
│       ├── package.json
│       └── tsconfig.json
│
├── turbo.json
├── package.json                      # bun workspaces config
├── .env.example
├── docker-compose.yml                # Local dev: Postgres + Redis
├── Dockerfile                        # Production API build
└── AXION.md                          # This file
```

---

## 7. Database Schema

### 7.1 Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────────┐
│    users      │────▶│  college_links    │────▶│     colleges       │
│  (Axion acct) │     │ (encrypted creds) │     │  (college config)  │
└──────┬───────┘     └────────┬─────────┘     └────────────────────┘
       │                      │
       │         ┌────────────┼────────────┬──────────────┐
       │         ▼            ▼            ▼              ▼
       │  ┌─────────────┐ ┌──────────┐ ┌────────┐ ┌─────────────┐
       │  │ attendances  │ │  marks   │ │courses │ │ timetables  │
       │  └─────────────┘ └──────────┘ └────────┘ └─────────────┘
       │
       ▼
┌──────────────┐
│ notifications │
└──────────────┘
```

### 7.2 Table Definitions

```sql
-- Colleges registered in the system
CREATE TABLE colleges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(50) UNIQUE NOT NULL,     -- 'ncu', 'bits', etc.
    name            VARCHAR(255) NOT NULL,            -- 'The NorthCap University'
    adapter_id      VARCHAR(50) NOT NULL,             -- maps to code adapter class
    config          JSONB NOT NULL DEFAULT '{}',      -- adapter-specific config
    attendance_threshold DECIMAL(5,2) DEFAULT 75.00,  -- per-college threshold
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Axion user accounts (managed by Better Auth)
-- Better Auth creates its own tables (user, session, account).
-- We extend with our own profile table:
CREATE TABLE user_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    push_subscription JSONB,          -- Web Push subscription object
    notification_prefs JSONB DEFAULT '{"push": true, "inApp": true}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Links between Axion accounts and college portals
CREATE TABLE college_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    college_id      UUID NOT NULL REFERENCES colleges(id),
    encrypted_username  TEXT NOT NULL,   -- AES-256-GCM encrypted
    encrypted_password  TEXT NOT NULL,   -- AES-256-GCM encrypted
    encryption_iv       TEXT NOT NULL,   -- Initialization vector
    college_user_id     TEXT,            -- User ID from college system (e.g., encoded ID)
    college_token       TEXT,            -- Cached auth token from college API
    token_expires_at    TIMESTAMPTZ,
    last_sync_at        TIMESTAMPTZ,
    sync_status         VARCHAR(20) DEFAULT 'pending', -- pending, syncing, success, failed
    sync_error          TEXT,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, college_id)
);

-- Cached attendance data
CREATE TABLE attendances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_link_id UUID NOT NULL REFERENCES college_links(id) ON DELETE CASCADE,
    course_code     VARCHAR(50) NOT NULL,
    course_name     VARCHAR(255),
    total_lectures  INTEGER DEFAULT 0,
    total_present   INTEGER DEFAULT 0,
    total_absent    INTEGER DEFAULT 0,
    total_loa       INTEGER DEFAULT 0,
    total_on_duty   INTEGER DEFAULT 0,
    percentage      DECIMAL(5,2),
    raw_data        JSONB,              -- Full response for this course
    synced_at       TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(college_link_id, course_code, synced_at)
);

-- We keep historical snapshots to power trend charts.
-- Latest attendance is the most recent synced_at per course.

-- Cached timetable data
CREATE TABLE timetables (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_link_id UUID NOT NULL REFERENCES college_links(id) ON DELETE CASCADE,
    day_of_week     SMALLINT NOT NULL,  -- 0=Sunday, 1=Monday, ...
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    course_code     VARCHAR(50),
    course_name     VARCHAR(255),
    faculty_name    VARCHAR(255),
    room            VARCHAR(100),
    section         VARCHAR(50),
    raw_data        JSONB,
    synced_at       TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Cached marks/grades
CREATE TABLE marks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_link_id UUID NOT NULL REFERENCES college_links(id) ON DELETE CASCADE,
    course_code     VARCHAR(50) NOT NULL,
    course_name     VARCHAR(255),
    exam_type       VARCHAR(100),       -- 'internal', 'midterm', 'final', 'assignment'
    max_marks       DECIMAL(6,2),
    obtained_marks  DECIMAL(6,2),
    grade           VARCHAR(5),         -- 'A+', 'A', 'B+', etc.
    sgpa            DECIMAL(4,2),
    cgpa            DECIMAL(4,2),
    semester        VARCHAR(20),
    raw_data        JSONB,
    synced_at       TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Cached course registrations
CREATE TABLE courses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_link_id UUID NOT NULL REFERENCES college_links(id) ON DELETE CASCADE,
    course_code     VARCHAR(50) NOT NULL,
    course_name     VARCHAR(255) NOT NULL,
    credits         DECIMAL(3,1),
    faculty_name    VARCHAR(255),
    section         VARCHAR(50),
    semester        VARCHAR(20),
    raw_data        JSONB,
    synced_at       TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- In-app notifications
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,  -- 'attendance_alert', 'new_marks', 'timetable_change', 'sync_error'
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    metadata        JSONB,                 -- type-specific data
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sync history log
CREATE TABLE sync_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_link_id UUID NOT NULL REFERENCES college_links(id) ON DELETE CASCADE,
    sync_type       VARCHAR(50) NOT NULL,  -- 'full', 'attendance', 'timetable', 'marks', 'courses'
    status          VARCHAR(20) NOT NULL,  -- 'started', 'success', 'failed'
    error_message   TEXT,
    duration_ms     INTEGER,
    started_at      TIMESTAMPTZ NOT NULL,
    completed_at    TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_college_links_user ON college_links(user_id);
CREATE INDEX idx_college_links_sync ON college_links(sync_status, last_sync_at);
CREATE INDEX idx_attendances_link ON attendances(college_link_id, synced_at DESC);
CREATE INDEX idx_attendances_latest ON attendances(college_link_id, course_code, synced_at DESC);
CREATE INDEX idx_timetables_link ON timetables(college_link_id, day_of_week);
CREATE INDEX idx_marks_link ON marks(college_link_id, course_code);
CREATE INDEX idx_courses_link ON courses(college_link_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_sync_logs_link ON sync_logs(college_link_id, started_at DESC);
```

---

## 8. College Adapter System

### 8.1 Adapter Interface

```typescript
// apps/api/src/infrastructure/college-adapters/adapter.interface.ts

export interface CollegeCredentials {
  username: string;
  password: string;
}

export interface CollegeAuthResult {
  token: string;
  expiresAt?: Date;
  collegeUserId?: string;   // e.g., the encoded user ID from NCU
  rawResponse?: unknown;
}

export interface AttendanceRecord {
  courseCode: string;
  courseName: string;
  totalLectures: number;
  totalPresent: number;
  totalAbsent: number;
  totalLOA: number;
  totalOnDuty: number;
  percentage: number;
  raw?: unknown;
}

export interface TimetableEntry {
  dayOfWeek: number;        // 0-6
  startTime: string;        // "HH:mm"
  endTime: string;          // "HH:mm"
  courseCode: string;
  courseName: string;
  facultyName?: string;
  room?: string;
  section?: string;
  raw?: unknown;
}

export interface MarkRecord {
  courseCode: string;
  courseName: string;
  examType: string;
  maxMarks?: number;
  obtainedMarks?: number;
  grade?: string;
  sgpa?: number;
  cgpa?: number;
  semester?: string;
  raw?: unknown;
}

export interface CourseRecord {
  courseCode: string;
  courseName: string;
  credits?: number;
  facultyName?: string;
  section?: string;
  semester?: string;
  raw?: unknown;
}

export interface CollegeAdapter {
  /** Unique adapter identifier — must match colleges.adapter_id in DB */
  readonly adapterId: string;

  /** Human-readable college name */
  readonly collegeName: string;

  /** Authenticate with the college portal */
  login(credentials: CollegeCredentials): Promise<CollegeAuthResult>;

  /** Fetch attendance summary */
  getAttendance(auth: CollegeAuthResult): Promise<AttendanceRecord[]>;

  /** Fetch timetable/schedule */
  getTimetable(auth: CollegeAuthResult): Promise<TimetableEntry[]>;

  /** Fetch marks/grades */
  getMarks(auth: CollegeAuthResult): Promise<MarkRecord[]>;

  /** Fetch registered courses */
  getCourses(auth: CollegeAuthResult): Promise<CourseRecord[]>;

  /** Check if token is still valid (optional optimization) */
  isTokenValid?(auth: CollegeAuthResult): Promise<boolean>;

  /** Refresh an expired token (if the college API supports it) */
  refreshToken?(auth: CollegeAuthResult): Promise<CollegeAuthResult>;
}
```

### 8.2 NCU Adapter (Reference Implementation)

Based on the reverse-engineered APIs from `attendance-cli.js`:

```typescript
// apps/api/src/infrastructure/college-adapters/ncu/ncu.adapter.ts

export class NcuAdapter implements CollegeAdapter {
  readonly adapterId = 'ncu-india';
  readonly collegeName = 'The NorthCap University';

  private readonly config = {
    baseUrl: 'https://uatapi.ncuindia.edu/api',
    loginPath: '/Authentication/ValidateUser',
    attendancePath: '/myapp/Registration/GetAttendanceSummary',
    origin: 'https://mycampus.ncuindia.edu',
    // ... other endpoints discovered from network tab
  };

  async login(credentials: CollegeCredentials): Promise<CollegeAuthResult> {
    // POST to ValidateUser with { UserName, Password, IpAddress: "", UserType: "" }
    // Extract token from response (handle multiple possible locations)
    // Return { token, collegeUserId }
  }

  async getAttendance(auth: CollegeAuthResult): Promise<AttendanceRecord[]> {
    // GET GetAttendanceSummary with Bearer token
    // Parse response.Data (may be stringified JSON)
    // Map to AttendanceRecord[]
  }

  async getTimetable(auth: CollegeAuthResult): Promise<TimetableEntry[]> {
    // Endpoint TBD — to be discovered from network tab
  }

  async getMarks(auth: CollegeAuthResult): Promise<MarkRecord[]> {
    // Endpoint TBD — to be discovered from network tab
  }

  async getCourses(auth: CollegeAuthResult): Promise<CourseRecord[]> {
    // Endpoint TBD — to be discovered from network tab
  }
}
```

### 8.3 Adding a New College

To add a new college:

1. Create a new directory: `apps/api/src/infrastructure/college-adapters/<college-slug>/`
2. Implement the `CollegeAdapter` interface
3. Register the adapter in the adapter registry
4. Add a row to the `colleges` table with `adapter_id` matching `adapterId`
5. Add recorded API response fixtures for testing

### 8.4 Testing Adapters

Each adapter has:
- **Recorded fixtures** — real API responses saved as JSON files in `__tests__/fixtures/`
- **Unit tests** — test parsing/mapping logic against fixtures using Vitest
- **Integration tests** (optional, manual) — test against live API with real credentials

---

## 9. API Endpoints

All endpoints use Hono RPC for type-safe client-server communication. The routes are organized by feature:

### 9.1 Auth Routes
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/*` | Better Auth handles all auth routes (Google OAuth, sessions) |

### 9.2 College Linking
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/colleges` | List all supported colleges |
| POST | `/api/college-links` | Link a college account (encrypts & stores credentials, triggers initial sync) |
| DELETE | `/api/college-links/:id` | Unlink a college account |
| GET | `/api/college-links` | List user's linked colleges with sync status |
| POST | `/api/college-links/:id/sync` | Trigger manual sync |

### 9.3 Attendance
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/attendance` | Get latest attendance summary for linked college |
| GET | `/api/attendance/history` | Get historical attendance data for trend charts |
| GET | `/api/attendance/projection` | Get projected attendance & classes-needed calculation |

### 9.4 Timetable
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/timetable` | Get full weekly timetable |
| GET | `/api/timetable/today` | Get today's schedule |

### 9.5 Marks
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/marks` | Get all marks/grades |
| GET | `/api/marks/summary` | Get SGPA/CGPA summary |

### 9.6 Courses
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/courses` | Get registered courses for current semester |

### 9.7 Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | Get user notifications (paginated) |
| PATCH | `/api/notifications/:id/read` | Mark notification as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |
| POST | `/api/notifications/subscribe` | Register push subscription |

---

## 10. Caching Strategy

### 10.1 Redis Cache Layers

```
Cache Key Pattern                          TTL        Purpose
─────────────────────────────────────────────────────────────
attendance:{collegeLinkId}                 30 min     Latest attendance summary
timetable:{collegeLinkId}                  6 hours    Weekly timetable (rarely changes)
marks:{collegeLinkId}                      1 hour     Marks data
courses:{collegeLinkId}                    24 hours   Course catalog (semester-long)
college:token:{collegeLinkId}              varies     Cached college auth token
user:notifications:count:{userId}          5 min      Unread notification count
```

### 10.2 Cache Flow

1. **Request arrives** → Check Redis cache
2. **Cache hit** → Return cached data immediately
3. **Cache miss** → Query Postgres (latest synced data) → Cache in Redis → Return
4. **Background sync** → Fetch from college API → Update Postgres → Invalidate Redis cache → Check for alert conditions

### 10.3 Cache Invalidation

- On successful sync: delete relevant cache keys for the college link
- On manual sync trigger: delete all cache keys for the college link
- On college unlink: delete all cache keys for the college link

---

## 11. Background Sync System

### 11.1 BullMQ Job Architecture

```
┌─────────────────────────────────────────┐
│              BullMQ Queues              │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  sync-queue                     │    │
│  │  - scheduleSyncAll (cron)       │    │  Twice daily (e.g., 7:00 AM, 7:00 PM)
│  │  - syncCollegeLink (per-user)   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  notification-queue             │    │
│  │  - checkAttendanceAlerts        │    │  After each sync
│  │  - sendPushNotification         │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 11.2 Sync Flow

1. **Cron job** (twice daily) → Enqueues `syncCollegeLink` job for every active college link
2. **syncCollegeLink worker**:
   - Decrypt credentials
   - Login to college API (or reuse cached token)
   - Fetch all data (attendance, timetable, marks, courses)
   - Upsert into Postgres
   - Invalidate Redis cache
   - Enqueue `checkAttendanceAlerts`
   - Log to `sync_logs`
3. **checkAttendanceAlerts worker**:
   - Compare attendance percentage to college threshold
   - Compare marks with previous sync (detect new marks)
   - Compare timetable with previous sync (detect changes)
   - Create notification records if needed
   - Send push notifications to subscribed users

### 11.3 Error Handling

- Retries: 3 attempts with exponential backoff (1min, 5min, 15min)
- After 3 failures: mark `college_link.sync_status = 'failed'`, create notification
- After 5 consecutive sync failures: deactivate the college link, notify user to re-authenticate

---

## 12. Security

### 12.1 Credential Encryption

College credentials are encrypted before storage using AES-256-GCM:

```typescript
// apps/api/src/infrastructure/encryption/credential-vault.ts

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY; // 32 bytes, hex-encoded

export function encryptCredential(plaintext: string): {
  ciphertext: string;
  iv: string;
  authTag: string;
} {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  };
}

export function decryptCredential(
  ciphertext: string,
  iv: string,
  authTag: string
): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 12.2 Security Measures

- **HTTPS everywhere** — TLS termination at reverse proxy (Caddy/Nginx)
- **HTTP-only cookies** — session tokens never exposed to JavaScript
- **CORS** — strict origin whitelist (only the CF Pages domain)
- **Rate limiting** — per-user and per-IP rate limits on all endpoints
- **Input validation** — Zod schemas validate all request payloads
- **SQL injection** — prevented by Drizzle ORM's parameterized queries
- **XSS** — React's built-in escaping + Content-Security-Policy headers
- **Encryption key rotation** — support for re-encrypting credentials with new key
- **No plaintext credentials in logs** — scrub sensitive data from all log output

---

## 13. PWA Implementation

### 13.1 Service Worker Strategy

Using [Workbox](https://developer.chrome.com/docs/workbox/) for service worker management:

| Resource | Strategy | Details |
|----------|----------|---------|
| App shell (HTML, JS, CSS) | Cache First | Pre-cached during install, updated in background |
| API responses | Stale While Revalidate | Serve cached, fetch fresh in background |
| Images / static assets | Cache First | Long-lived cache with versioned URLs |
| Fonts | Cache First | Cached indefinitely |

### 13.2 Offline Support

- **IndexedDB** — store last synced data locally for offline access
- Tanstack Query's built-in persistence via `persistQueryClient` + IndexedDB adapter
- Offline indicator in UI when connectivity is lost
- Queued manual sync requests execute when back online

### 13.3 Push Notifications

- Web Push API with VAPID keys
- Push subscription stored in `user_profiles.push_subscription`
- Backend uses `web-push` library to send notifications
- Notification types:
  - Attendance alert (below threshold)
  - New marks posted
  - Timetable change detected
  - Sync failure

---

## 14. Deployment & Infrastructure

### 14.1 DigitalOcean Droplet Setup

**Specs**: 2 vCPU, 4GB RAM, $16/mo

```
┌─────────────────────────────────────────┐
│         DigitalOcean Droplet            │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Caddy (reverse proxy + TLS)     │  │  :443 → :3000
│  └──────────────┬────────────────────┘  │
│                 │                        │
│  ┌──────────────▼────────────────────┐  │
│  │  Bun + Hono API (:3000)           │  │
│  │  + BullMQ Workers                 │  │
│  └──────────────┬────────────────────┘  │
│         ┌───────┴───────┐               │
│  ┌──────▼──────┐ ┌──────▼──────┐       │
│  │ PostgreSQL  │ │    Redis    │       │
│  │   (:5432)   │ │   (:6379)  │       │
│  └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────┘
```

All services managed via **Docker Compose** (Postgres, Redis) + **systemd** or **pm2** for the Bun process.

Alternatively, use **Coolify** or **Dokku** for container orchestration if preferred.

### 14.2 Frontend Deployment (Cloudflare Pages)

- Connected to GitHub repo → auto-deploy on push to `main`
- Build command: `bun run --filter web build`
- Output directory: `apps/web/dist`
- Custom domain: `axion.yourdomain.com` (or similar)
- `_redirects` file for SPA routing: `/* /index.html 200`

### 14.3 Environment Variables

```env
# API Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://axion:password@localhost:5432/axion

# Redis
REDIS_URL=redis://localhost:6379

# Better Auth
BETTER_AUTH_SECRET=<random-32-char-string>
BETTER_AUTH_URL=https://api.axion.yourdomain.com
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>

# Credential Encryption
CREDENTIAL_ENCRYPTION_KEY=<64-hex-chars-representing-32-bytes>

# Push Notifications (VAPID)
VAPID_PUBLIC_KEY=<vapid-public-key>
VAPID_PRIVATE_KEY=<vapid-private-key>
VAPID_SUBJECT=mailto:admin@axion.yourdomain.com

# Frontend URL (for CORS)
FRONTEND_URL=https://axion.yourdomain.com

# Sync Schedule (cron)
SYNC_CRON_SCHEDULE=0 7,19 * * *   # 7:00 AM and 7:00 PM daily
```

---

## 15. UI / UX Design

### 15.1 Design System

- **Style**: Minimal / Modern (Linear/Notion-inspired)
- **Colors**: Dark mode primary (with light mode toggle). Neutral base with accent color for alerts.
- **Typography**: Inter or Geist Sans (system font stack fallback)
- **Components**: shadcn/ui as base, customized to match design system
- **Charts**: Recharts with custom theme for attendance trends

### 15.2 Key Screens

```
┌─────────────────────────────────────┐
│  1. Landing / Login                  │
│  - "Sign in with Google" button      │
│  - Brief product description         │
│  - College logos                     │
├─────────────────────────────────────┤
│  2. Onboarding (College Linking)     │
│  - Select college from dropdown      │
│  - Enter college portal credentials  │
│  - "Link Account" → triggers sync    │
│  - Loading state while initial sync  │
├─────────────────────────────────────┤
│  3. Dashboard (Home)                 │
│  - Overall attendance percentage     │
│  - Today's schedule (next class)     │
│  - Recent notifications              │
│  - Quick stats cards                 │
├─────────────────────────────────────┤
│  4. Attendance Detail                │
│  - Subject-wise table/cards          │
│  - Color-coded percentage            │
│  │  (green ≥ threshold,             │
│  │   yellow ≥ threshold-5,          │
│  │   red < threshold-5)             │
│  - Trend chart (line graph)          │
│  - "Classes needed" calculator       │
│  - Projected final percentage        │
├─────────────────────────────────────┤
│  5. Timetable                        │
│  - Week view (tabs for each day)     │
│  - Timeline/card layout              │
│  - Current class highlighted         │
├─────────────────────────────────────┤
│  6. Marks / Grades                   │
│  - Subject-wise breakdown            │
│  - Exam type tabs                    │
│  - SGPA / CGPA display               │
├─────────────────────────────────────┤
│  7. Courses                          │
│  - Card list of registered courses   │
│  - Faculty, credits, section info    │
├─────────────────────────────────────┤
│  8. Notifications                    │
│  - Chronological list                │
│  - Filter by type                    │
│  - Mark as read                      │
├─────────────────────────────────────┤
│  9. Settings                         │
│  - Linked colleges (manage)          │
│  - Notification preferences          │
│  - Theme toggle (dark/light)         │
│  - Account (sign out)                │
└─────────────────────────────────────┘
```

### 15.3 Mobile Navigation (PWA)

Bottom navigation bar with 5 tabs:
1. **Home** (dashboard)
2. **Attendance**
3. **Schedule**
4. **Marks**
5. **More** (courses, notifications, settings)

---

## 16. Testing Strategy

### 16.1 Test Pyramid

| Layer | Tool | Scope |
|-------|------|-------|
| Unit tests | Vitest | Domain entities, use cases, adapters (with fixtures), utility functions |
| Integration tests | Vitest + Testcontainers | Repository tests against real Postgres, cache tests against real Redis |
| API tests | Vitest + Hono test client | Route-level tests with mocked use cases |
| E2E tests | Playwright (future) | Critical user flows (login, link college, view attendance) |

### 16.2 College Adapter Testing

```
apps/api/src/infrastructure/college-adapters/ncu/__tests__/
├── fixtures/
│   ├── login-response.json          # Recorded real API response
│   ├── attendance-response.json     # Recorded real API response
│   ├── timetable-response.json
│   ├── marks-response.json
│   └── courses-response.json
├── ncu.adapter.test.ts              # Tests parsing & mapping logic
└── ncu.integration.test.ts          # (Optional) Live API test, skipped in CI
```

**Recording fixtures**: Run `attendance-cli.js` (or similar scripts) against the real API, save responses as JSON fixtures.

---

## 17. Development Workflow

### 17.1 Local Setup

```bash
# Clone and install
git clone <repo-url> axion
cd axion
bun install

# Start infrastructure (Postgres + Redis)
docker-compose up -d

# Run database migrations
bun run --filter api db:migrate

# Seed colleges table
bun run --filter api db:seed

# Start API server (with hot reload)
bun run --filter api dev

# Start frontend (with hot reload)
bun run --filter web dev
```

### 17.2 Git Workflow

- `main` — production branch, auto-deploys
- `dev` — development branch, PRs merged here first
- Feature branches: `feat/<feature-name>`
- Bug fix branches: `fix/<bug-name>`
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`

---

## 18. Roadmap

### Phase 1 — Foundation (Week 1-2)
- [ ] Monorepo setup (Turborepo, bun workspaces)
- [ ] Hono API scaffold with clean architecture folder structure
- [ ] Drizzle ORM setup + database schema + migrations
- [ ] Redis connection + caching layer
- [ ] Better Auth integration (Google OAuth)
- [ ] Credential encryption (AES-256-GCM)
- [ ] College adapter interface + NCU adapter (attendance)
- [ ] React SPA scaffold (Vite, Tanstack Router, Tanstack Query)
- [ ] Basic UI: login, onboarding, attendance view

### Phase 2 — Core Features (Week 3-4)
- [ ] Complete NCU adapter (timetable, marks, courses endpoints)
- [ ] All 4 data modules: attendance, timetable, marks, courses
- [ ] BullMQ background sync (twice daily)
- [ ] Attendance analytics (trends, projections, classes-needed)
- [ ] Notification system (in-app)
- [ ] Dashboard home screen

### Phase 3 — Polish (Week 5-6)
- [ ] PWA setup (Workbox, manifest, service worker)
- [ ] Push notifications (Web Push API)
- [ ] Offline support (IndexedDB + Tanstack Query persistence)
- [ ] Dark/light theme toggle
- [ ] Mobile-optimized UI with bottom nav
- [ ] Comprehensive testing (unit + integration)
- [ ] Docker Compose for production
- [ ] Deploy to DigitalOcean + Cloudflare Pages

### Phase 4 — Growth (Post-Launch)
- [ ] Second college adapter
- [ ] User feedback system
- [ ] Performance monitoring (error tracking)
- [ ] Rate limit optimization based on usage patterns
- [ ] SGPA/CGPA calculator
- [ ] Export data (PDF attendance report)

---

## 19. Open Questions & Decisions to Make

1. **NCU API endpoints** — Need to discover timetable, marks, and courses API endpoints from the network tab (only attendance is currently known).
2. **Domain name** — What domain will Axion use?
3. **Logo and branding** — Design needed before launch.
4. **Legal** — Terms of service and privacy policy (storing encrypted college credentials).
5. **College API stability** — What happens if NCU changes their API? Monitoring/alerting strategy needed.
6. **Multiple college links** — Can a student be enrolled in multiple colleges? (Probably not, but the schema supports it.)
7. **Semester handling** — How to detect semester transitions and clear stale data.

---

## 20. Key Technical Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | SPA + Hono API (separated) | Clean API boundary, free frontend hosting, future mobile app support |
| Frontend | React SPA on CF Pages | Free global CDN, no SSR needed for auth-only dashboard |
| Backend runtime | Bun | Faster than Node.js, lower memory footprint |
| API framework | Hono | Lightweight, Bun-native, type-safe RPC |
| ORM | Drizzle | Lighter than Prisma, better Bun compatibility, no binary dependency |
| Auth | Better Auth (Google OAuth) | Full-featured, supports Drizzle adapter |
| Job queue | BullMQ | Battle-tested, Redis-backed, great for scheduled sync |
| Monorepo | Turborepo + bun | Fast builds, shared packages, bun-native runtime |
| Multi-tenancy | Shared DB with college_id | Simpler, sufficient for v1 scale |
| Credential storage | AES-256-GCM encrypted | Enables background sync while protecting credentials |
| Cache | Redis with TTL per resource | Fast reads, simple invalidation on sync |
| Testing | Vitest + recorded fixtures | Fast, reliable adapter testing without live API calls |
| Deployment | DO ($16/mo) + CF Pages (free) | Cost-effective, no cold starts, smooth UX |
| API style | Hono RPC (type-safe) | End-to-end type safety without codegen |
| State management | Tanstack Query + Zustand | Server state via TQ, minimal client state via Zustand |
| Validation | Zod (shared) | Single source of truth for API contracts |
