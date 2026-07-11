# CASAtlas — Engineering Specification

**Version:** 1.0
**Status:** Phase 0 — Architecture & Planning
**Date:** 2026-07-11

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Folder Structure](#2-folder-structure)
3. [Database Schema](#3-database-schema)
4. [Entity Relationship Diagram](#4-entity-relationship-diagram)
5. [API Strategy](#5-api-strategy)
6. [Authentication Flow](#6-authentication-flow)
7. [Authorization Strategy](#7-authorization-strategy)
8. [Storage Architecture](#8-storage-architecture)
9. [Docker Architecture](#9-docker-architecture)
10. [Configuration System](#10-configuration-system)
11. [UI Design System](#11-ui-design-system)
12. [Component Hierarchy](#12-component-hierarchy)
13. [Routing Strategy](#13-routing-strategy)
14. [State Management Strategy](#14-state-management-strategy)
15. [Performance Strategy](#15-performance-strategy)
16. [Security Strategy](#16-security-strategy)
17. [Accessibility Strategy](#17-accessibility-strategy)
18. [Error Handling Strategy](#18-error-handling-strategy)
19. [Logging Strategy](#19-logging-strategy)
20. [Testing Strategy](#20-testing-strategy)
21. [Documentation Strategy](#21-documentation-strategy)
22. [Backup Strategy](#22-backup-strategy)
23. [Development Roadmap](#23-development-roadmap)
24. [Risks and Tradeoffs](#24-risks-and-tradeoffs)
25. [Future Extensibility](#25-future-extensibility)

---

## 1. High-Level Architecture

CASAtlas is a **single-process monolith** built on Next.js with the App Router. There is no separate backend service. The application handles rendering, data access, authentication, and file storage within one deployable unit.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Docker Compose                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Next.js Application                  │   │
│  │                                                   │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────┐  │   │
│  │  │  Server      │  │  Route       │  │ Server │  │   │
│  │  │  Components  │  │  Handlers    │  │ Actions│  │   │
│  │  │  (RSC)       │  │  (API)       │  │        │  │   │
│  │  └──────┬──────┘  └──────┬───────┘  └───┬────┘  │   │
│  │         │                 │              │        │   │
│  │  ┌──────┴─────────────────┴──────────────┴────┐  │   │
│  │  │              Service Layer                  │  │   │
│  │  │  (business logic, validation, auth checks)  │  │   │
│  │  └──────────────────┬─────────────────────────┘  │   │
│  │                     │                            │   │
│  │  ┌──────────────────┴─────────────────────────┐  │   │
│  │  │              Data Layer                     │  │   │
│  │  │  Prisma ORM ──── Storage Provider           │  │   │
│  │  └───────┬──────────────────┬─────────────────┘  │   │
│  └──────────┼──────────────────┼────────────────────┘   │
│             │                  │                         │
│  ┌──────────┴──────┐  ┌───────┴──────────┐             │
│  │   PostgreSQL     │  │  Filesystem       │             │
│  │   (database)     │  │  (uploads/)       │             │
│  └─────────────────┘  └──────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering | React Server Components (RSC) by default | Minimal client JS, better performance, simpler data fetching |
| Mutations | Server Actions | Type-safe, progressive enhancement, no API boilerplate |
| File uploads | Route Handlers | Required for `multipart/form-data` handling |
| ORM | Prisma | Type safety, excellent migrations, first-class Next.js support |
| Authentication | Auth.js | Mature, supports OAuth providers, account linking built in |
| Styling | Tailwind + shadcn/ui | Copy-paste components, no runtime CSS-in-JS, fully customizable |
| State | Server-first | RSC eliminates most client state; use React hooks for UI-only state |

### Server vs Client Component Split

- **Server Components (default):** Data fetching, layouts, lists, read-only views
- **Client Components (`"use client"`):** Forms, interactive UI, modals, drag-and-drop, rich text editor, upload zones, optimistic updates

Rule of thumb: if it needs `useState`, `useEffect`, event handlers, or browser APIs → Client Component. Everything else stays on the server.

---

## 2. Folder Structure

Feature-first organization. Each module owns its pages, API routes, server actions, and internal components.

```
casatlas/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group (no layout prefix)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── error/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Auth-specific layout (centered card)
│   │   │
│   │   ├── (dashboard)/              # Dashboard route group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── experiences/
│   │   │   │   ├── page.tsx          # Experience list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create experience
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # View experience
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx  # Edit experience
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx          # Settings index (redirects to profile)
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── appearance/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── accounts/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── security/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── accessibility/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx            # Dashboard layout (sidebar + header)
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts      # Auth.js catch-all route
│   │   │   ├── upload/
│   │   │   │   └── route.ts          # File upload endpoint
│   │   │   └── files/
│   │   │       └── [...path]/
│   │   │           └── route.ts      # Serve uploaded files
│   │   │
│   │   ├── globals.css               # Tailwind base + custom properties
│   │   ├── layout.tsx                # Root layout (providers, fonts)
│   │   └── not-found.tsx
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── index.ts              # Module barrel export
│   │   │   ├── auth.ts               # Auth.js configuration (handlers, signIn, signOut, auth)
│   │   │   └── auth.actions.ts       # Server Action wrappers (signOutAction, etc.)
│   │   │
│   │   ├── experiences/
│   │   │   ├── index.ts
│   │   │   ├── experience.service.ts # Business logic
│   │   │   ├── experience.actions.ts # Server Actions
│   │   │   ├── experience.types.ts   # Shared types
│   │   │   └── components/
│   │   │       ├── experience-form.tsx
│   │   │       ├── experience-card.tsx
│   │   │       ├── experience-list.tsx
│   │   │       ├── experience-timeline.tsx
│   │   │       ├── experience-detail.tsx
│   │   │       ├── evidence-upload.tsx
│   │   │       ├── evidence-gallery.tsx
│   │   │       ├── learning-outcomes.tsx
│   │   │       ├── cas-strands.tsx
│   │   │       ├── reflection-editor.tsx
│   │   │       └── experience-filters.tsx
│   │   │
│   │   ├── uploads/
│   │   │   ├── index.ts
│   │   │   ├── storage.provider.ts   # StorageProvider interface
│   │   │   ├── storage.local.ts      # Local filesystem implementation
│   │   │   ├── upload.service.ts     # Upload business logic
│   │   │   ├── upload.actions.ts     # Server Actions
│   │   │   └── upload.utils.ts       # Thumbnail gen, validation
│   │   │
│   │   ├── users/
│   │   │   ├── index.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.actions.ts
│   │   │   └── user.types.ts
│   │   │
│   │   └── settings/
│   │       ├── index.ts
│   │       ├── settings.service.ts
│   │       ├── settings.actions.ts
│   │       └── settings.types.ts
│   │
│   ├── components/                   # Shared, reusable UI components
│   │   ├── ui/                       # shadcn/ui components (copied in)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   └── tooltip.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx           # Dashboard sidebar
│   │   │   ├── header.tsx            # Dashboard header
│   │   │   ├── footer.tsx
│   │   │   ├── mobile-nav.tsx        # Mobile navigation
│   │   │   ├── theme-toggle.tsx      # Dark/light mode toggle
│   │   │   └── breadcrumb.tsx
│   │   └── shared/
│   │       ├── avatar.tsx
│   │       ├── confirm-dialog.tsx
│   │       ├── empty-state.tsx
│   │       ├── error-boundary.tsx
│   │       ├── loading-spinner.tsx
│   │       ├── page-header.tsx
│   │       ├── search-input.tsx
│   │       ├── date-picker.tsx
│   │       ├── rich-text-editor.tsx   # Wrapper around editor lib
│   │       └── file-dropzone.tsx      # Drag-and-drop upload zone
│   │
│   ├── hooks/
│   │   ├── use-autosave.ts
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   └── use-upload.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts                  # Prisma client singleton
│   │   ├── auth.ts                    # Auth.js helper (getServerSession)
│   │   ├── utils.ts                   # cn() and other small helpers
│   │   ├── validations.ts             # Shared Zod schemas
│   │   ├── constants.ts               # App-wide constants
│   │   └── errors.ts                  # Custom error classes
│   │
│   ├── config/
│   │   ├── site.ts                    # Site name, description, URLs
│   │   ├── auth.ts                    # OAuth provider config
│   │   ├── upload.ts                  # Upload limits, allowed types
│   │   ├── features.ts                # Feature toggles
│   │   └── dashboard.ts               # Dashboard widget config
│   │
│   ├── styles/
│   │   └── fonts.ts                   # Font definitions (next/font)
│   │
│   └── types/
│       └── index.ts                   # Global shared types
│
├── prisma/
│   ├── schema.prisma                  # Database schema
│   ├── seed.ts                        # Seed script
│   └── migrations/                    # Auto-generated migrations
│
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── placeholders/
│       └── default-avatar.png
│
├── uploads/                           # Local file storage (gitignored)
│   └── .gitkeep
│
├── docs/
│   ├── architecture.md
│   └── adr/                           # Architecture Decision Records
│       └── 001-initial-stack.md
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── .env.example
├── .env.local                         # Local dev env (gitignored)
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
└── SPEC.md                            # This document
```

### Conventions

- **Module barrel exports:** Each module exposes its public API through `index.ts`. Internal files are not imported from outside the module.
- **Components inside modules are private.** Only services, actions, types, and the barrel export are public.
- **Shared components** (`components/shared/`) have no module-specific logic. They are pure UI.
- **shadcn/ui components** live in `components/ui/`. They are copied from the shadcn registry and can be modified.
- **Config files** are in `config/` — not scattered across modules. Import from `@/config/feature-name`.

---

## 3. Database Schema

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Auth.js Models ───────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts    Account[]
  sessions    Session[]
  settings    UserSettings?
  experiences Experience[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ─── Application Models ──────────────────────────────────

model UserSettings {
  id        String   @id @default(cuid())
  userId    String   @unique
  theme     Theme    @default(DARK)
  language  String   @default("en")
  timezone  String   @default("UTC")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}

model Experience {
  id          String          @id @default(cuid())
  userId      String
  title       String
  date        DateTime
  description String?         @db.Text
  reflection  String?         @db.Text   // Rich text stored as HTML/JSON
  supervisor  String?
  hours       Float?
  location    String?
  notes       String?         @db.Text
  isGroup     Boolean         @default(false)
  status      ExperienceStatus @default(DRAFT)
  deletedAt   DateTime?       // Soft delete
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  user       User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  outcomes   LearningOutcome[]
  strands    CASStrand[]
  evidence   Evidence[]
  revisions  ExperienceRevision[]

  @@index([userId, status])
  @@index([userId, date])
  @@map("experiences")
}

model LearningOutcome {
  id           String @id @default(cuid())
  experienceId String
  outcome      String // "Identify own strengths and develop areas for growth"

  experience Experience @relation(fields: [experienceId], references: [id], onDelete: Cascade)

  @@unique([experienceId, outcome])
  @@map("learning_outcomes")
}

model CASStrand {
  id           String @id @default(cuid())
  experienceId String
  strand       Strand

  experience Experience @relation(fields: [experienceId], references: [id], onDelete: Cascade)

  @@unique([experienceId, strand])
  @@map("cas_strands")
}

model Evidence {
  id           String   @id @default(cuid())
  experienceId String
  type         EvidenceType
  url          String
  filename     String
  mimeType     String
  size         Int
  thumbnailUrl String?
  createdAt    DateTime @default(now())

  experience Experience @relation(fields: [experienceId], references: [id], onDelete: Cascade)

  @@index([experienceId])
  @@map("evidence")
}

model ExperienceRevision {
  id           String   @id @default(cuid())
  experienceId String
  snapshot     Json     // Full experience state at time of revision
  createdAt    DateTime @default(now())

  experience Experience @relation(fields: [experienceId], references: [id], onDelete: Cascade)

  @@index([experienceId, createdAt])
  @@map("experience_revisions")
}

// ─── Enums ────────────────────────────────────────────────

enum Theme {
  DARK
  LIGHT
}

enum ExperienceStatus {
  DRAFT
  SUBMITTED
  APPROVED
  NEEDS_REVISION
  ARCHIVED
}

enum Strand {
  CREATIVITY
  ACTIVITY
  SERVICE
}

enum EvidenceType {
  IMAGE
  VIDEO
  PDF
  LINK
}
```

### Schema Design Notes

- **Auth.js tables** (`User`, `Account`, `Session`, `VerificationToken`) follow the official Auth.js Prisma adapter schema exactly. Do not modify these.
- **Soft delete** is implemented via `deletedAt` on `Experience`. Queries must filter `WHERE deletedAt IS NULL` by default. A utility function handles this.
- **Experience revisions** store full snapshots as JSON. This is simple and sufficient for v1. Future phases may switch to differential storage.
- **Learning outcomes and CAS strands** are stored as join tables, not arrays. This enables querying ("find all experiences with outcome X") without JSON parsing.
- **Reflections** are stored as HTML/JSON text. The rich text editor exports to a format that can be stored in a `Text` column. No separate rich text schema is needed.
- **File evidence** stores metadata only. The actual file is on the filesystem (or future object storage). The `url` field stores the relative path or storage key.

---

## 4. Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│    User       │       │   Account    │       │     Session      │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ id           │──1:N──│ userId       │       │ userId           │
│ name         │       │ provider     │       │ sessionToken     │
│ email        │       │ providerAccId│       │ expires          │
│ emailVerified│       │ access_token │       └──────────────────┘
│ image        │       │ refresh_token│
│ createdAt    │       │ expires_at   │
│ updatedAt    │       └──────────────┘
└──────┬───────┘
       │
       │ 1:1
       ▼
┌──────────────┐       ┌──────────────────┐
│ UserSettings │       │   Experience     │
├──────────────┤       ├──────────────────┤
│ userId       │       │ id               │
│ theme        │       │ userId           │──N:1──▶ User
│ language     │       │ title            │
│ timezone     │       │ date             │
└──────────────┘       │ description      │
                       │ reflection       │
                       │ supervisor       │
                       │ hours            │
                       │ location         │
                       │ notes            │
                       │ isGroup          │
                       │ status           │
                       │ deletedAt        │
                       │ createdAt        │
                       │ updatedAt        │
                       └────────┬─────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
              ▼                 ▼                  ▼
    ┌─────────────────┐ ┌────────────┐  ┌──────────────────┐
    │ LearningOutcome │ │ CASStrand  │  │     Evidence     │
    ├─────────────────┤ ├────────────┤  ├──────────────────┤
    │ experienceId    │ │ experienceId│ │ experienceId     │
    │ outcome         │ │ strand      │ │ type             │
    └─────────────────┘ └────────────┘  │ url              │
                                        │ filename         │
                                        │ mimeType         │
                                        │ size             │
                                        │ thumbnailUrl     │
                                        └──────────────────┘

    ┌──────────────────────┐
    │ ExperienceRevision   │
    ├──────────────────────┤
    │ experienceId         │
    │ snapshot (JSON)      │
    │ createdAt            │
    └──────────────────────┘
```

---

## 5. API Strategy

CASAtlas uses two mechanisms for client-server communication:

### Server Actions (Primary)

Used for all data mutations: create, update, delete experiences, settings changes, etc.

```typescript
// modules/experiences/experience.actions.ts
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createExperience(data: ExperienceInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // validate with Zod, create in DB, revalidate cache
  const experience = await prisma.experience.create({
    data: { ...validated, userId: session.user.id }
  })

  revalidatePath("/experiences")
  return experience
}
```

**Why Server Actions over Route Handlers for mutations:**
- Type-safe end-to-end (TypeScript infers input/output types)
- No manual fetch/axios calls from the client
- Progressive enhancement (works without JS)
- Automatic revalidation with `revalidatePath`/`revalidateTag`
- Less boilerplate than defining API routes + client fetch wrappers

### Route Handlers (Limited Use)

Used only where Server Actions cannot be:

1. **File uploads** — `multipart/form-data` requires a raw request body
2. **Serving uploaded files** — streaming binary responses
3. **Auth.js callbacks** — required by Auth.js

```typescript
// app/api/upload/route.ts
export async function POST(request: Request) {
  const formData = await request.formData()
  // validate, store, return metadata
}
```

### Data Fetching

Server Components fetch data directly via Prisma. No API layer needed.

```typescript
// app/(dashboard)/experiences/page.tsx (Server Component)
import { prisma } from "@/lib/prisma"

export default async function ExperiencesPage() {
  const experiences = await prisma.experience.findMany({
    where: { deletedAt: null },
    orderBy: { date: "desc" }
  })

  return <ExperienceList experiences={experiences} />
}
```

### Validation

All inputs validated with **Zod** schemas. Schemas defined in module `.types.ts` files, shared between Server Actions and client forms.

```typescript
// modules/experiences/experience.types.ts
import { z } from "zod"

export const experienceInputSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.date(),
  description: z.string().max(5000).optional(),
  reflection: z.string().max(50000).optional(),
  // ...
})

export type ExperienceInput = z.infer<typeof experienceInputSchema>
```

---

## 6. Authentication Flow

### Auth.js Configuration

```typescript
// modules/auth/auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
})
```

### Account Linking Flow

1. User signs in with Provider A → account created
2. User goes to Settings → Connected Accounts
3. User clicks "Connect GitHub" (or Google)
4. Auth.js detects existing user by email → links new provider to existing account
5. Both providers now point to the same `User` record via separate `Account` rows

### Registration Control

`config/auth.ts` controls whether open registration is allowed:

```typescript
export const authConfig = {
  allowRegistration: true, // Set to false to disable new sign-ups
  defaultRole: "student", // For future role system
}
```

When `allowRegistration: false`, the `/register` page shows a message, and new OAuth logins that would create a new user are rejected at the callback.

### Route Protection

Route protection happens in the `(dashboard)` layout (`src/app/(dashboard)/layout.tsx`), which calls `auth()` and redirects to `/login` if the session is missing. Each Server Component under `(dashboard)` inherits this guard.

API routes (`src/app/api/**/route.ts`) and Server Actions each call `auth()` independently to check the session before performing any work.


---

## 7. Authorization Strategy

### Model

CASAtlas uses a **simple ownership model** for v1:

- Each user owns their experiences, evidence, and settings
- Users can only read/modify their own data
- No roles needed for v1 (admin, teacher roles deferred to future phases)

### Implementation

Authorization checks happen in **service layer functions**, not middleware or components.

```typescript
// modules/experiences/experience.service.ts
export async function getExperience(id: string, userId: string) {
  const experience = await prisma.experience.findUnique({
    where: { id, userId } // userId in WHERE clause = ownership check
  })

  if (!experience) throw new NotFoundError("Experience not found")
  return experience
}
```

Every Server Action calls the service layer, passing the authenticated user's ID. The service layer enforces ownership via Prisma `where` clauses.

### Future Roles

The schema does not include a `role` column on `User` yet. When roles are needed:

1. Add `role` enum column to `User`
2. Add role-checking middleware
3. Service layer methods gain a role parameter
4. No schema migration needed for existing data — all users default to `STUDENT`

---

## 8. Storage Architecture

### StorageProvider Interface

```typescript
// modules/uploads/storage.provider.ts
export interface StorageProvider {
  /** Store a file and return its key/path */
  put(key: string, file: ReadableStream, metadata: FileMetadata): Promise<StorageResult>

  /** Retrieve a file as a readable stream */
  get(key: string): Promise<ReadableStream | null>

  /** Delete a file */
  delete(key: string): Promise<void>

  /** Get a public URL (for local storage, this routes through the API) */
  getUrl(key: string): string
}

export interface FileMetadata {
  contentType: string
  size: number
  filename: string
}

export interface StorageResult {
  key: string
  url: string
  size: number
}
```

### Local Filesystem Implementation

```typescript
// modules/uploads/storage.local.ts
import { createWriteStream } from "fs"
import { mkdir, unlink, access } from "fs/promises"
import { join } from "path"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads"

export class LocalStorageProvider implements StorageProvider {
  private baseDir = UPLOAD_DIR

  async put(key: string, file: ReadableStream, metadata: FileMetadata): Promise<StorageResult> {
    const filePath = join(this.baseDir, key)
    await mkdir(join(this.baseDir, dirname(key)), { recursive: true })

    // Stream to file
    const writeStream = createWriteStream(filePath)
    const reader = file.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      writeStream.write(value)
    }
    writeStream.end()

    return {
      key,
      url: `/api/files/${key}`,
      size: metadata.size,
    }
  }

  async get(key: string): Promise<ReadableStream | null> {
    // ... read file as stream
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.baseDir, key)
    await unlink(filePath)
  }

  getUrl(key: string): string {
    return `/api/files/${key}`
  }
}
```

### File Organization

Files stored under `uploads/` with this structure:

```
uploads/
└── {userId}/
    └── {experienceId}/
        ├── {timestamp}-{random}.{ext}
        ├── {timestamp}-{random}-thumb.{ext}    # Generated thumbnails
        └── ...
```

### Upload Flow

1. Client drops files into `<FileDropzone>` component
2. Client POSTs `FormData` to `/api/upload`
3. Route handler validates file type, size, and user session
4. Route handler streams file to `StorageProvider.put()`
5. Route handler creates `Evidence` record in database
6. Returns evidence metadata to client
7. Client updates UI optimistically

### File Size Limits

Configured in `config/upload.ts`:

```typescript
export const uploadConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50 MB
  allowedTypes: {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/webm"],
    document: ["application/pdf"],
  },
  thumbnailSize: { width: 300, height: 300 },
  thumbnailFormat: "webp",
}
```

---

## 9. Docker Architecture

### Dockerfile

Multi-stage build for production optimization:

```dockerfile
# docker/Dockerfile

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Stage 2: Build
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# Stage 3: Production
FROM node:20-alpine AS runner
RUN corepack enable
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create upload directory
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker/docker-compose.yml

services:
  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://casatlas:casatlas@db:5432/casatlas
      AUTH_SECRET: ${AUTH_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET}
      UPLOAD_DIR: /app/uploads
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: casatlas
      POSTGRES_USER: casatlas
      POSTGRES_PASSWORD: casatlas
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U casatlas"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
  uploads_data:
```

### Production Deployment

For real deployments, use environment variables instead of hardcoded secrets:

```bash
# .env (for Docker Compose)
AUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

---

## 10. Configuration System

### Approach

Simple TypeScript config files. No runtime feature-flag service, no database-stored config for v1. User-specific settings (theme, language) are in the database.

### Config Files

```typescript
// config/site.ts
export const siteConfig = {
  name: "CASAtlas",
  description: "Document and manage your IB CAS journey",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
}

// config/auth.ts
export const authConfig = {
  allowRegistration: process.env.ALLOW_REGISTRATION !== "false",
  providers: {
    google: { enabled: !!process.env.GOOGLE_CLIENT_ID },
    github: { enabled: !!process.env.GITHUB_CLIENT_ID },
  },
}

// config/upload.ts
export const uploadConfig = {
  maxFileSize: 50 * 1024 * 1024,
  allowedTypes: {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/webm"],
    document: ["application/pdf"],
  },
  thumbnailSize: { width: 300, height: 300 },
}

// config/features.ts
export const featureConfig = {
  timeline: true,
  search: true,
  autosave: true,
  evidenceUpload: true,
  richTextReflections: true,
  // Future features — disabled for now
  teacherDashboard: false,
  notifications: false,
  portfolioExport: false,
  aiAssistant: false,
}

// config/dashboard.ts
export const dashboardConfig = {
  widgets: {
    recentExperiences: { enabled: true, limit: 5 },
    progressOverview: { enabled: true },
    quickActions: { enabled: true },
    casBreakdown: { enabled: true },
  },
}
```

### Environment Variables

All environment variables documented in `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/casatlas"

# Auth
AUTH_SECRET="generate-with-openssl-rand-base64-32"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ALLOW_REGISTRATION="true"

# Upload
UPLOAD_DIR="./uploads"
```

---

## 11. UI Design System

### Color Palette

**Dark Theme (Default)**

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0a0a0a` | Page background (matte black) |
| `--surface` | `#141414` | Cards, panels (dark gray) |
| `--surface-hover` | `#1a1a1a` | Hover states |
| `--border` | `#262626` | Borders, dividers |
| `--text-primary` | `#fafafa` | Primary text |
| `--text-secondary` | `#a1a1aa` | Secondary text (zinc-400) |
| `--text-muted` | `#52525b` | Muted text (zinc-600) |
| `--accent` | `#10b981` | Primary action, links (emerald-500) |
| `--accent-hover` | `#059669` | Accent hover (emerald-600) |
| `--accent-muted` | `#064e3b` | Accent background tint (emerald-900) |
| `--destructive` | `#ef4444` | Delete, error (red-500) |
| `--warning` | `#f59e0b` | Warning states (amber-500) |
| `--success` | `#22c55e` | Success states (green-500) |

**Light Theme**

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#ffffff` | Page background |
| `--surface` | `#f4f4f5` | Cards, panels (zinc-100) |
| `--surface-hover` | `#e4e4e7` | Hover states (zinc-200) |
| `--border` | `#d4d4d8` | Borders (zinc-300) |
| `--text-primary` | `#09090b` | Primary text (zinc-950) |
| `--text-secondary` | `#52525b` | Secondary text (zinc-600) |
| `--accent` | `#059669` | Primary action (emerald-600) |

### Typography

Using **Inter** for body text and **Geist** for headings (or similar clean sans-serif from Google Fonts via `next/font`).

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `h1` | 2.25rem | 700 | 1.2 | Page titles |
| `h2` | 1.5rem | 600 | 1.3 | Section headings |
| `h3` | 1.25rem | 600 | 1.4 | Card titles |
| `body` | 1rem | 400 | 1.5 | Default text |
| `body-sm` | 0.875rem | 400 | 1.5 | Secondary text |
| `caption` | 0.75rem | 400 | 1.5 | Labels, metadata |

### Spacing

Consistent 4px grid:

- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-12`: 48px
- `--space-16`: 64px

### Border Radius

- `--radius-sm`: 6px (inputs, small elements)
- `--radius-md`: 8px (cards, panels)
- `--radius-lg`: 12px (modals, large cards)
- `--radius-xl`: 16px (feature cards)
- `--radius-full`: 9999px (avatars, badges)

### Shadows

Minimal, subtle shadows for depth:

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
```

### Animations

Minimal and purposeful:

- `transition-colors`: 150ms ease (hover states)
- `transition-opacity`: 200ms ease (loading states)
- `transition-transform`: 200ms ease (scale on hover)

No decorative animations. No page transitions. Motion is functional.

---

## 12. Component Hierarchy

```
RootLayout
├── ThemeProvider
├── Toaster (sonner)
│
├── (auth)/layout.tsx
│   └── AuthCard
│       ├── Logo
│       ├── OAuthButtons
│       └── children (form)
│
└── (dashboard)/layout.tsx
    ├── Sidebar
    │   ├── Logo
    │   ├── NavLinks
    │   │   ├── Dashboard
    │   │   ├── Experiences
    │   │   └── Settings
    │   └── UserMenu
    │       ├── Avatar
    │       ├── ThemeToggle
    │       └── SignOut
    │
    ├── Header (mobile)
    │   ├── MobileNav (sheet)
    │   └── SearchInput
    │
    └── MainContent
        ├── PageHeader
        ├── children (page content)
        │
        │   ├── DashboardPage
        │   │   ├── ProgressOverview
        │   │   ├── CASBreakdown
        │   │   ├── RecentExperiences
        │   │   └── QuickActions
        │   │
        │   ├── ExperiencesPage
        │   │   ├── ExperienceFilters
        │   │   ├── SearchInput
        │   │   ├── ExperienceTimeline
        │   │   │   └── ExperienceCard[]
        │   │   └── EmptyState (when no results)
        │   │
        │   ├── ExperienceDetailPage
        │   │   ├── ExperienceHeader (title, date, status badge)
        │   │   ├── LearningOutcomes (checkboxes)
        │   │   ├── CASStrands (checkboxes)
        │   │   ├── ReflectionDisplay
        │   │   ├── EvidenceGallery
        │   │   │   └── EvidenceCard[] (image preview, video, PDF, link)
        │   │   ├── ExperienceMeta (hours, location, supervisor)
        │   │   └── ExperienceActions (edit, delete, status change)
        │   │
        │   ├── ExperienceFormPage
        │   │   ├── ExperienceForm
        │   │   │   ├── TitleInput
        │   │   │   ├── DatePicker
        │   │   │   ├── DescriptionTextarea
        │   │   │   ├── ReflectionEditor (rich text)
        │   │   │   ├── LearningOutcomes (checkboxes)
        │   │   │   ├── CASStrands (checkboxes)
        │   │   │   ├── SupervisorInput
        │   │   │   ├── HoursInput
        │   │   │   ├── LocationInput
        │   │   │   ├── NotesTextarea
        │   │   │   ├── IsGroupToggle
        │   │   │   └── EvidenceUpload
        │   │   │       ├── FileDropzone
        │   │   │       └── EvidenceList (with previews)
        │   │   └── SaveStatus (autosave indicator)
        │   │
        │   └── SettingsPage
        │       ├── SettingsLayout (tabs or sidebar)
        │       ├── ProfileSettings
        │       ├── AppearanceSettings
        │       │   └── ThemeToggle
        │       ├── ConnectedAccounts
        │       │   └── ProviderCard[]
        │       ├── SecuritySettings
        │       └── AccessibilitySettings
```

---

## 13. Routing Strategy

### Route Groups

| Route Group | Purpose | Layout |
|-------------|---------|--------|
| `(auth)` | Login, register, error pages | Centered card layout, no sidebar |
| `(dashboard)` | All authenticated pages | Sidebar + header + main content |

### Public Routes

- `/login` — Sign in page
- `/register` — Registration page (if enabled)
- `/auth/error` — Auth error page

### Protected Routes (require authentication)

- `/dashboard` — Main dashboard
- `/experiences` — Experience list
- `/experiences/new` — Create experience
- `/experiences/[id]` — View experience
- `/experiences/[id]/edit` — Edit experience
- `/settings` — Settings (redirects to `/settings/profile`)
- `/settings/profile` — Profile settings
- `/settings/appearance` — Theme settings
- `/settings/accounts` — Connected accounts
- `/settings/security` — Security settings
- `/settings/accessibility` — Accessibility settings

### API Routes

- `/api/auth/[...nextauth]` — Auth.js handler (public)
- `/api/upload` — File upload (authenticated)
- `/api/files/[...path]` — Serve uploaded files (authenticated, owner-only)

### URL Patterns

- Kebab-case for URLs: `/experiences/new`, not `/experiences/newExperience`
- No file extensions
- Trailing slashes: no (Next.js default)

---

## 14. State Management Strategy

### Principle: Server-First, Client-Only When Necessary

**Server state** (experiences, user data, settings): fetched in Server Components, passed as props. No client-side state management library.

**UI state** (modals, form inputs, optimistic updates): local React state via `useState`/`useReducer`. No global state store.

### Patterns

| Concern | Solution |
|---------|----------|
| Data fetching | Server Components + Prisma directly |
| Data mutations | Server Actions + `useActionState` / `useFormStatus` |
| Form state | React Hook Form + Zod validation |
| UI state (modals, drawers) | Local `useState` |
| Optimistic updates | `useOptimistic` (React 19) |
| URL state (filters, search) | `useSearchParams` + `useRouter` |
| Theme | CSS custom properties + `next-themes` |
| Toast notifications | `sonner` (lightweight, no context provider needed) |

### Why No Redux/Zustand/Jotai

For a monolithic app with server-rendered data, a global store adds complexity without benefit. Server Components eliminate the need to fetch and cache data on the client. UI state is local and ephemeral.

If a future feature requires complex client-side state (e.g., offline support, collaborative editing), evaluate then. YAGNI.

---

## 15. Performance Strategy

### Server-Side

- **React Server Components** by default — zero client-side JS for read-only views
- **Prisma `select`** — fetch only needed columns, avoid N+1 with `include`
- **Database indexing** — indexes on `userId`, `date`, `status`, and `deletedAt`
- **`revalidatePath`/`revalidateTag`** — targeted cache invalidation after mutations
- **Connection pooling** — Prisma manages a connection pool (default: 10 connections)

### Client-Side

- **Minimal client JS** — only interactive components get `"use client"`
- **Image optimization** — `next/image` for all user-uploaded images with proper `sizes` prop
- **Code splitting** — dynamic imports for heavy components (rich text editor, PDF viewer)
- **No client-side routing data fetching** — Server Components handle data

### Network

- **Static assets** — served from CDN or Next.js static optimization
- **Compression** — gzip/brotli via Next.js built-in or reverse proxy
- **Cache headers** — `Cache-Control` on static assets, `no-cache` on dynamic pages

### Monitoring

- **Core Web Vitals** — track LCP, FID, CLS
- **Prisma query logging** — log slow queries in development
- **Bundle analysis** — `@next/bundle-analyzer` in development

---

## 16. Security Strategy

### Authentication & Session

- Auth.js handles session management with encrypted JWTs or database sessions
- CSRF protection built into Auth.js
- Secure cookie flags: `HttpOnly`, `Secure`, `SameSite=Lax`

### Input Validation

- **Zod schemas** on every Server Action and Route Handler
- **Server-side validation only** — client validation is UX, not security
- **HTML sanitization** — sanitize rich text reflections before storage (use `DOMPurify` or similar)

### File Upload Security

- **MIME type validation** — check both declared type and magic bytes
- **File size limits** — enforced server-side
- **Filename sanitization** — generate random filenames, never use user-provided names
- **Storage isolation** — files organized by userId, access checked per request
- **No executable uploads** — reject `.exe`, `.sh`, `.js`, etc.

### SQL Injection

- Prisma parameterizes all queries — no raw SQL unless explicitly needed
- If raw SQL is ever required, use Prisma's `$queryRaw` with tagged templates

### Rate Limiting

- Implement basic rate limiting on auth endpoints and file uploads
- Use in-memory rate limiting for v1 (sufficient for single-process deployment)
- Future: Redis-based rate limiting if horizontal scaling is needed

### Headers

- CSP headers via Next.js `headers()` config
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Dependencies

- `pnpm audit` in CI pipeline
- Dependabot or Renovate for automated dependency updates

---

## 17. Accessibility Strategy

### Standards

Target **WCAG 2.1 AA** compliance.

### Implementation

| Area | Approach |
|------|----------|
| Semantic HTML | `<nav>`, `<main>`, `<header>`, `<article>`, `<section>`, `<aside>` |
| Landmarks | Every page has proper landmark structure |
| Headings | Hierarchical h1 → h2 → h3, no skipped levels |
| Focus management | Visible focus rings on all interactive elements, focus trap in modals |
| Keyboard navigation | All functionality accessible via keyboard, Tab order follows visual order |
| Color contrast | Minimum 4.5:1 for normal text, 3:1 for large text |
| Alt text | All images have descriptive alt text or `alt=""` for decorative |
| Form labels | Every input has a visible or `aria-label` label |
| Error messages | `aria-live` regions for dynamic error announcements |
| Screen reader | Test with VoiceOver/NVDA; use `aria-*` attributes where native semantics insufficient |
| Motion | `prefers-reduced-motion` respected — disable non-essential animations |

### shadcn/ui

shadcn/ui components include proper ARIA attributes and keyboard handling out of the box. When customizing, maintain these attributes.

---

## 18. Error Handling Strategy

### Error Types

| Type | Example | Handling |
|------|---------|----------|
| Validation error | Invalid form input | Return field-level errors to form |
| Not found | Experience doesn't exist | Show not-found page |
| Unauthorized | Not logged in | Redirect to login |
| Forbidden | Accessing another user's data | Show not-found (don't reveal existence) |
| Server error | Database connection failure | Show error page, log details |
| Upload error | File too large | Return specific error to upload component |

### Implementation

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, "NOT_FOUND", 404)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401)
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", public fieldErrors?: Record<string, string[]>) {
    super(message, "VALIDATION_ERROR", 400)
  }
}
```

### Server Action Error Handling

```typescript
// In Server Actions
export async function createExperience(data: ExperienceInput) {
  try {
    // validate, create, return
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, errors: error.flatten().fieldErrors }
    }
    if (error instanceof AppError) {
      return { success: false, error: error.message, code: error.code }
    }
    // Unexpected error — log and return generic message
    console.error("Unexpected error:", error)
    return { success: false, error: "Something went wrong" }
  }
}
```

### Error Boundaries

```typescript
// components/shared/error-boundary.tsx
"use client"

import { Component, type ReactNode } from "react"

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>
    }
    return this.props.children
  }
}
```

Route-level error boundaries via `error.tsx` files in the App Router.

### User-Facing Messages

- Use `sonner` toast library for transient errors (form submissions, uploads)
- Use inline error messages for form validation
- Use `error.tsx` page boundaries for route-level errors
- Never expose stack traces or internal error details to users

---

## 19. Logging Strategy

### Approach

Minimal for v1. Log to stdout, let Docker handle log aggregation.

### What to Log

| Level | What | When |
|-------|------|------|
| `error` | Unhandled exceptions, database failures | Always |
| `warn` | Auth failures, rate limit hits | Always |
| `info` | App startup, config loaded | Startup |
| `debug` | Query timing, request details | Development only |

### Implementation

Use `console.log`/`console.error` for v1. Structured logging (pino, winston) can be added when needed — it's a drop-in replacement.

```typescript
// lib/logger.ts — thin wrapper for easy future replacement
export const logger = {
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: "error", message, ...context, timestamp: new Date().toISOString() }))
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: "warn", message, ...context, timestamp: new Date().toISOString() }))
  },
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: "info", message, ...context, timestamp: new Date().toISOString() }))
  },
}
```

### What NOT to Log

- User passwords or tokens
- Full file contents
- PII beyond user ID
- Full request/response bodies (unless debugging)

---

## 20. Testing Strategy

### Levels

| Level | Tool | What | Coverage Target |
|-------|------|------|-----------------|
| Unit | Vitest | Service functions, utilities, Zod schemas | High for business logic |
| Integration | Vitest + Prisma | Server Actions, database queries | Medium |
| E2E | Playwright | Critical user flows | Key paths only |

### What to Test

**High priority (test first):**
- Experience CRUD operations
- File upload validation and storage
- Authentication flows
- Authorization (ownership checks)
- Form validation (Zod schemas)
- Utility functions

**Medium priority:**
- Dashboard data aggregation
- Search functionality
- Settings updates

**Low priority (skip for v1):**
- Layout rendering
- Static pages
- Theme switching

### Test File Convention

```
src/
├── modules/
│   └── experiences/
│       ├── experience.service.ts
│       ├── experience.service.test.ts    # Co-located unit tests
│       └── __tests__/
│           └── experience.actions.test.ts # Integration tests
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/experience-flow.spec.ts
test.describe("Experience Flow", () => {
  test("user can create, view, and edit an experience", async ({ page }) => {
    // Login
    // Navigate to new experience
    // Fill form
    // Submit
    // Verify created
    // Edit
    // Verify updated
  })
})
```

### CI Integration

```yaml
# In CI pipeline
- pnpm lint
- pnpm type-check
- pnpm test
- pnpm build
```

---

## 21. Documentation Strategy

### What to Document

| Document | Location | Audience |
|----------|----------|----------|
| README | `README.md` | Users, contributors |
| Setup guide | `README.md` section | Developers |
| Architecture | `docs/architecture.md` | Developers |
| ADRs | `docs/adr/` | Developers |
| API (internal) | Code comments + types | Developers |
| User guide | Deferred to Phase 5+ | End users |

### README Contents

1. Project description
2. Screenshots (after Phase 2)
3. Tech stack
4. Prerequisites
5. Quick start (Docker Compose)
6. Development setup
7. Environment variables
8. Project structure
9. Contributing guide
10. License

### Architecture Decision Records (ADRs)

One ADR per significant decision:

```
docs/adr/
├── 001-initial-stack.md
├── 002-storage-architecture.md
├── 003-auth-strategy.md
└── ...
```

ADR format: Title, Status, Context, Decision, Consequences.

---

## 22. Backup Strategy

### Database

```bash
# Manual backup
pg_dump -U casatlas casatlas > backup_$(date +%Y%m%d).sql

# Restore
psql -U casatlas casatlas < backup_20260711.sql
```

### Docker Compose Backup

```yaml
# Add to docker-compose.yml for automated backups
  backup:
    image: prodrigestivill/postgres-backup-local
    restart: always
    volumes:
      - ./backups:/backups
    environment:
      POSTGRES_HOST: db
      POSTGRES_DB: casatlas
      POSTGRES_USER: casatlas
      POSTGRES_PASSWORD: casatlas
      SCHEDULE: "@daily"
      BACKUP_KEEP_DAYS: 7
      BACKUP_KEEP_WEEKS: 4
```

### Files

The `uploads/` volume should be backed up separately:

```bash
# Backup uploads volume
docker run --rm -v casatlas_uploads_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /data .
```

### Future

- Automated backup cron jobs
- Remote backup storage (S3, etc.)
- Point-in-time recovery for PostgreSQL

---

## 23. Development Roadmap

### Phase 1: Foundation (Weeks 1-3)

**Goal:** Authentication working, project structure established, database deployed.

- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind CSS, shadcn/ui, Lucide Icons
- [ ] Configure Prisma with PostgreSQL schema
- [ ] Set up Auth.js with Google and GitHub OAuth
- [ ] Create login/register pages
- [ ] Implement middleware for route protection
- [ ] Set up Docker Compose (app + PostgreSQL)
- [ ] Create root layout with theme provider
- [ ] Set up ESLint, Prettier, TypeScript strict mode
- [ ] Basic project documentation (README, .env.example)

**Deliverable:** A running app with login/logout, protected dashboard shell, Docker deployment.

### Phase 2: Core Features (Weeks 4-6)

**Goal:** Experiences CRUD, file uploads, basic dashboard.

- [ ] Experience CRUD (create, read, update, soft delete)
- [ ] Experience form with validation
- [ ] Learning outcomes checkboxes
- [ ] CAS strands checkboxes
- [ ] Experience status workflow (draft → submitted → approved)
- [ ] File upload with drag-and-drop
- [ ] Image previews and thumbnails
- [ ] PDF viewer
- [ ] Basic dashboard with experience list
- [ ] Experience timeline view

**Deliverable:** A student can create experiences with evidence and view them on a dashboard.

### Phase 3: Polish & Search (Weeks 7-8)

**Goal:** Search, autosave, responsive design, UX polish.

- [ ] Search by title, date, learning outcomes
- [ ] Autosave for experience drafts
- [ ] Save status indicator
- [ ] Responsive design (mobile sidebar, mobile forms)
- [ ] Empty states for all lists
- [ ] Loading states and skeletons
- [ ] Toast notifications for all actions
- [ ] Keyboard shortcuts for power users

**Deliverable:** A polished, responsive application with search and autosave.

### Phase 4: Rich Text & Settings (Weeks 9-10)

**Goal:** Rich text editor, user settings, theme switching.

- [ ] Rich text editor for reflections (TipTap or similar)
- [ ] Settings pages (profile, appearance, connected accounts, security, accessibility)
- [ ] Theme switching (dark ↔ light)
- [ ] Theme persistence with user account
- [ ] Connected accounts management (link/unlink)
- [ ] Account deletion

**Deliverable:** Full-featured experience editing and complete settings management.

### Phase 5: Testing & Documentation (Weeks 11-12)

**Goal:** Test coverage, documentation, production readiness.

- [ ] Unit tests for service layer
- [ ] Integration tests for Server Actions
- [ ] E2E tests for critical flows (Playwright)
- [ ] Comprehensive README
- [ ] Architecture documentation
- [ ] Docker production optimization
- [ ] Security audit checklist
- [ ] Performance baseline

**Deliverable:** A tested, documented, production-ready application.

### Phase 6: Advanced Features (Post-v1)

- Teacher/admin dashboards
- Notifications
- Reports and analytics
- Portfolio export (PDF)
- Calendar integration
- AI reflection assistant
- Experience templates
- Supervisor approvals
- Public portfolio sharing
- PWA / offline support
- Email system
- OCR for evidence

**These are NOT implemented in v1.** Architecture leaves room for all of them.

---

## 24. Risks and Tradeoffs

### Accepted Tradeoffs

| Decision | Tradeoff | Mitigation |
|----------|----------|------------|
| **Filesystem storage** | Doesn't scale horizontally, hard to backup | StorageProvider abstraction makes S3 migration trivial when needed |
| **Single monolith** | No independent scaling of services | Sufficient for school-scale adoption; microservices would be overengineering |
| **JSON snapshots for revisions** | Large storage for frequent revisions | Acceptable for v1; add differential storage if needed |
| **No global state management** | May need refactoring for complex client state | Current architecture handles all v1 needs; evaluate if offline/collaboration added |
| **In-memory rate limiting** | Resets on restart, doesn't work across instances | Acceptable for single-process Docker; add Redis when scaling |
| **Inline error logging** | No log aggregation, search, or alerting | Sufficient for v1; structured logging + Docker log drivers when needed |
| **No E2E tests initially** | Manual testing required during early phases | Added in Phase 5; critical paths covered first |
| **Config files only** | No runtime config changes without redeploy | Acceptable for school deployment; database config store if needed |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Rich text editor complexity | High | Medium | Use TipTap (proven, well-maintained). If too complex, fall back to textarea with markdown |
| File upload reliability | Medium | High | Chunked uploads, retry logic, clear error messages |
| Auth.js breaking changes | Low | Medium | Pin version, Auth.js is mature and stable |
| PostgreSQL performance | Low | High | Proper indexing, connection pooling, query optimization |
| Scope creep | High | High | Strict phase boundaries, YAGNI, defer everything not in v1 |
| Deployment complexity for schools | Medium | Medium | Docker Compose one-command setup, clear documentation |

### What Was Postponed (And Why)

| Feature | Reason for Deferral |
|---------|-------------------|
| Teacher/admin dashboards | Requires role system, different UX. Not needed for student-only v1 |
| Notifications | Requires background job system, email service. Add when users request it |
| Portfolio export | PDF generation is complex. Add when core features are stable |
| AI reflection assistant | External API dependency, cost. Add as opt-in feature |
| PWA/offline | Significant complexity. Add when mobile usage data shows need |
| S3 storage | Filesystem works for single-server deployment. StorageProvider abstraction makes this a config change |
| Database-stored config | File config is simpler and sufficient. Runtime config changes are rare for school deployments |
| Redis rate limiting | In-memory works for single process. Add when scaling beyond one instance |
| Automated backups | Manual backup scripts work for v1. Automate when deployment is standardized |

---

## 25. Future Extensibility

### Extension Points

The architecture includes these deliberate extension points:

1. **StorageProvider interface** — swap filesystem for S3/R2/MinIO without changing application code
2. **Auth.js providers** — add OAuth providers by adding one line to the config
3. **Feature flags** — `config/features.ts` enables/disables features without code changes
4. **Module structure** — new features (teacher dashboard, notifications) are new modules, not modifications to existing ones
5. **Role system** — schema designed to accommodate a `role` column without migration complexity
6. **Plugin-ready config** — configuration system can be extended with database-backed config when runtime changes are needed

### Adding a New Module

When adding a future feature (e.g., notifications):

```
src/modules/notifications/
├── index.ts
├── notification.service.ts
├── notification.actions.ts
├── notification.types.ts
└── components/
    └── notification-bell.tsx
```

- Add to sidebar navigation
- Add to `config/features.ts`
- No changes to existing modules required

### Adding a New OAuth Provider

In `modules/auth/auth.ts`:

```typescript
import Apple from "next-auth/providers/apple"

// Add to providers array:
Apple({
  clientId: process.env.APPLE_CLIENT_ID,
  clientSecret: process.env.APPLE_CLIENT_SECRET,
}),
```

Auth.js handles everything else (account linking, session management).

### Database Migrations

Prisma migrations are forward-only. For breaking schema changes:

1. Create migration with `prisma migrate dev`
2. Write seed data if needed
3. Test rollback plan manually (document in ADR)
4. Deploy migration before deploying new application code

### Technology Upgrades

- **Next.js:** Upgrade via `pnpm up next`. Check changelog for breaking changes.
- **Prisma:** Upgrade via `pnpm up prisma @prisma/client`. Run `prisma generate` after.
- **Tailwind:** Upgrade via `pnpm up tailwindcss`. Check for class name changes.
- **shadcn/ui:** Re-run `npx shadcn@latest add` to get latest component versions.

---

## Appendix: Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | latest stable | Framework |
| `react` | latest stable | UI library |
| `typescript` | latest stable | Type safety |
| `tailwindcss` | latest stable | Utility-first CSS |
| `@prisma/client` | latest stable | ORM |
| `next-auth` | latest stable | Authentication |
| `@auth/prisma-adapter` | latest stable | Auth.js + Prisma integration |
| `zod` | latest stable | Schema validation |
| `sonner` | latest stable | Toast notifications |
| `next-themes` | latest stable | Theme switching |
| `lucide-react` | latest stable | Icons |
| `react-hook-form` | latest stable | Form management |
| `@tiptap/react` | latest stable | Rich text editor (Phase 4) |
| `sharp` | latest stable | Image thumbnail generation |

---

*This specification is the single source of truth for CASAtlas. All implementation decisions should reference this document. Update this document when architectural decisions change.*
