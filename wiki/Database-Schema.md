# Database Schema

The schema is in [`prisma/schema.prisma`](https://github.com/vihaanvp/casatlas/blob/main/prisma/schema.prisma). This page walks through what each model is, why it's shaped that way, and where it gets used.

The database is PostgreSQL 16. We don't use any PostgreSQL-specific features beyond what's portable enough to swap to another DB later if needed (no JSONB queries, no triggers, no LISTEN/NOTIFY).

---

## Entities at a glance

```
┌────────────────┐ 1   N ┌──────────────┐
│     User       │───────│   Account    │   ← Auth.js OAuth
│   ──────────   │       ├──────────────┤
│ id, name,      │       │ provider,    │
│ email,         │       │ providerAccId│
│ role,          │       └──────────────┘
│ emailVerified  │ 1   1 ┌──────────────┐
│                │───────│ UserSettings │
└─────┬──────────┘       └──────────────┘
      │ 1
      │ N
      ▼
┌────────────────────┐ 1 ┌────────────────┐ ┌──────────────────┐ ┌────────────────────┐
│    Experience      │ N │ LearningOutcome│ │    CASStrand     │ │     Evidence       │
│  ─────────────     │───│ ──────────     │ │ ──────           │ │ ──────────         │
│ title, date,       │   │ outcome text   │ │ strand enum      │ │ type, url,         │
│ description,       │   └────────────────┘ └──────────────────┘ │ mimeType, size     │
│ reflection,        │                          ┌────────────────────┐
│ status, deletedAt, │ 1 N                      │ ExperienceRevision │
│ hours, location... ├──────────────────────────────│                 │
└────────┬───────────┘                       │ snapshot JSON      │
         │                                   └────────────────────┘
         │ N
         ▼
   ┌──────────────┐
   │   Comment    │  ← threaded (parentId)
   └──────────────┘

┌─────────────────────┐
│ TeacherStudent      │   ← join table: teacher ↔ student
└─────────────────────┘

┌──────────────────┐ ┌──────────────────┐
│   AuditLog       │ │  Notification    │
│   ──────────     │ │  ──────────      │
│   action enum,   │ │  type enum,      │
│   entity, IP     │ │  read, link      │
└──────────────────┘ └──────────────────┘
```

---

## Auth.js models

```prisma
model User { id, name, email?, emailVerified?, image?, role: Role, createdAt, updatedAt }
model Account { userId, provider, providerAccountId, refresh_token?, access_token?, ... }
model Session { userId, sessionToken (unique), expires }
model VerificationToken { identifier, token (unique), expires }
```

These follow the **official `@auth/prisma-adapter` schema**. Don't change them without checking the adapter's docs first — they're load-bearing.

`User.role` is the only non-standard addition; it's defaulted to `STUDENT`. The `jwt` callback in `src/modules/auth/auth.ts` fetches the role on sign-in and stuffs it into the token.

---

## Application models

### `Experience`

The heart of the app. Each row is one CAS activity the student logged.

```prisma
model Experience {
  id, userId, title, date,
  description?, reflection?,
  supervisor?, hours?, location?, notes?,
  isGroup Bool, status: ExperienceStatus,
  deletedAt? (soft delete),
  createdAt, updatedAt
}
```

Indexes:
- `(userId, status)` — filters by status within a user
- `(userId, date)` — chronological list/feed

Notable design choices:

- **Soft delete via `deletedAt`.** Every query filters `WHERE deletedAt IS NULL`. There's a 30-day window after deletion where the experience still exists and can be restored (`/experiences/[id]/edit` shows restored experiences if the row is found via `findFirst` with `deletedAt: { not: null }`). After the 30 days, we'd want a purge job (not yet implemented).
- **Reflections are stored as opaque text.** Whatever the rich text editor outputs is stored verbatim — the editor is responsible for sanitisation.
- **`revisions` is a separate join model**, snapshotting the full state on every update. This makes "show last 10 revisions" trivial via Prisma's `take: 10` ordering. Differential storage is overkill at this scale.

### `LearningOutcome` and `CASStrand`

These are join tables, not arrays on `Experience`. Two reasons:

1. **Searchability.** "Find all experiences that hit outcome #5" is a simple indexable query, not JSON scraping.
2. **Per-strand counts.** The dashboard's strand progress bar is one round-trip with `select`.

The fixed list of `LearningOutcome` strings is in `src/lib/constants.ts`:

```ts
export const LEARNING_OUTCOMES = [
  "Identify own strengths and develop areas for growth",
  "Demonstrate that challenges have been undertaken, developing new skills in the process",
  // ...
] as const
```

`CASStrand` is the enum `CREATIVITY | ACTIVITY | SERVICE`, with labels in the constants file.

Both join tables are **replaced, not merged, on every update** (see `updateExperience` in `experience.service.ts`). Submitting a form with two strands selected wipes existing strands and creates the two new ones. This is simpler than diffing and matches what the UI shows the user.

### `Evidence`

```prisma
model Evidence {
  id, experienceId, type: EvidenceType,
  url, filename, mimeType, size,
  thumbnailUrl?, createdAt
}
```

Only metadata. The actual bytes are in `StorageProvider` (filesystem today). `url` is a path like `/api/files/{userId}/{experienceId}/{file}.jpg` — the `/api/files/[...path]` route handler is the only way to read them, enforcing auth + path-owner check.

`EvidenceType` is `IMAGE | VIDEO | PDF | LINK`. The `LINK` variant means "external URL, no file uploaded" — only `url` and `filename` are meaningful.

### `Comment`

Threaded comments on experiences. `parentId` is self-referential. Both `parent` and `replies` relations live on the same row.

```prisma
model Comment {
  id, experienceId, userId,
  content (Text), parentId?,
  createdAt, updatedAt
}
```

Top-level comments and replies are sorted independently in `getComments()` (top-level desc by date, replies asc), giving the natural "chat thread" read direction.

### `TeacherStudent`

Many-to-many between teachers (`User` with `role = TEACHER`) and students (`User` with `role = STUDENT`). Composite uniqueness on `(teacherId, studentId)`.

The convention: **assignments are replaced, not merged**, on every save in `assignStudents()` — see `src/modules/admin/admin.actions.ts`. This is simpler than diffing for v0.1.x but is something to remember.

### `AuditLog`

Append-only log of meaningful system actions. Action types are an enum:

```prisma
enum AuditAction {
  LOGIN, LOGOUT, ACCOUNT_LINKED,
  EXPERIENCE_CREATED, EXPERIENCE_UPDATED, EXPERIENCE_DELETED,
  EXPERIENCE_SUBMITTED, EXPERIENCE_APPROVED, EXPERIENCE_REVISION_REQUESTED,
  COMMENT_ADDED,
  USER_ROLE_CHANGED,
  TEACHER_ASSIGNED, TEACHER_UNASSIGNED,
  CONFIG_CHANGED
}
```

Notable: **`auditLog()` is fire-and-forget.** If the database write fails (e.g. transient connection blip), the user-facing action still succeeds. A failure would be visible in application logs but not in the audit table — that's a tradeoff we accept for v0.1. (`src/lib/audit.ts` swallows the error.)

### `Notification`

In-app notification rows for the bell icon. Indexed `(userId, read, createdAt)` so the "first 20 unread" query is a single index hit.

```prisma
model Notification {
  id, userId, type: NotificationType,
  title, message,
  read bool, link?, createdAt
}
```

Created by `createNotification()` from `src/lib/notifications.ts`, called by teacher/admin actions when something meaningful happens (an experience is approved, a revision was requested, someone comments).

---

## Enums

| Enum | Values | Used by |
|------|--------|---------|
| `Theme` | `DARK`, `LIGHT` | `UserSettings.theme` |
| `Role` | `STUDENT`, `TEACHER`, `ADMIN` | `User.role` |
| `ExperienceStatus` | `DRAFT`, `SUBMITTED`, `APPROVED`, `NEEDS_REVISION`, `ARCHIVED` | `Experience.status` |
| `Strand` | `CREATIVITY`, `ACTIVITY`, `SERVICE` | `CASStrand.strand` |
| `EvidenceType` | `IMAGE`, `VIDEO`, `PDF`, `LINK` | `Evidence.type` |
| `AuditAction` | (13 values) | `AuditLog.action` |
| `NotificationType` | `EXPERIENCE_APPROVED`, `REVISION_REQUESTED`, `TEACHER_COMMENT`, `PORTFOLIO_EXPORT`, `ANNOUNCEMENT` | `Notification.type` |

---

## Migrations

- Created with `pnpm prisma migrate dev --name <descriptive-name>`
- Applied in CI by `pnpm prisma migrate deploy` (the no-create variant)
- The Docker image's `postinstall` runs `prisma generate` so the client is always up-to-date with the schema

If you're contributing, every schema change ships with a migration **in the same PR**. CI fails the build if you forget to run `pnpm prisma migrate dev`.

---

## Planted seeds (none yet)

`prisma/seed.ts` currently does nothing — see the file itself. There's no seed data because:
- We don't want random sample CAS experiences leaking into a real instance.
- A future "load demo data" feature belongs in admin tools, not the seed.

If you want a dev seed of fixtures (a teacher, a student, a few experiences), write one in `prisma/seed.ts` and run `pnpm db:seed`.

---

## Where to go next

- **End-to-end guide to changing the schema** → [Adding an Experience Field](Adding-an-Experience-Field)
- **Backups** — see [Operating CASAtlas#backups](Operating-CASAtlas#backups) (the schema isn't special; it's just a `pg_dump` away)
- **Architecture overview** → [Architecture](Architecture)
