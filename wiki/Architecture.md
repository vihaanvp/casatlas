# Architecture

CASAtlas is a **single-process monolith**. Everything — render, mutations, auth, storage — lives in one Next.js app.

```
┌─────────────────────────────────────────────┐
│               Next.js Application           │
│                                             │
│  Server Components ──┐                      │
│  Server Actions    ──┼──► Service Layer ──► Prisma ──► PostgreSQL
│  Route Handlers    ──┘                      │
│       │                                      │
│       └──────────────────► StorageProvider ──► Filesystem (or future S3)
│                                             │
│  Auth.js ──────────────────► OAuth providers│
└─────────────────────────────────────────────┘
```

There is no separate backend service. Tests run against the same Next.js app via Vitest (Node env) and Vitest's module-resolution for `@/`.

For full architectural diagrams and design rationale, see [SPEC.md on the main repo](https://github.com/vihaanvp/casatlas/blob/main/SPEC).

---

## Three client-server mechanics, picked deliberately

| Mechanic | Used for | Why |
|----------|----------|-----|
| **Server Components** | All reads — dashboard, experience pages, admin tables, lists | Zero client JS, full server-fetched, no API plumbing |
| **Server Actions** (`"use server"`) | All mutations — create/update/delete experiences, role changes, settings, comments | Type-safe end-to-end, progressive enhancement, automatic `revalidatePath` |
| **Route Handlers** (`app/api/.../route.ts`) | Three narrow things Server Actions can't do | Multi-part uploads, binary file serving, Auth.js callbacks |

If you're adding a feature and reach for a Route Handler, double-check you actually need one. Server Actions cover 95% of mutation needs.

---

## Authorization model

CASAtlas uses **role-based access control** with three roles:

- **`STUDENT`** — default for any new sign-in. Can manage their own experiences.
- **`TEACHER`** — can read experiences of students assigned to them; can `APPROVE` and `REQUEST_REVISION`; can comment.
- **`ADMIN`** — full system access. User management, role assignments, audit logs, permanent deletes.

The role is fetched from the database on sign-in via the `jwt` callback and stuffed into the session token. Every Server Action checks `session.user.role` against what it's about to do. The mapping from role → permissions lives in `src/lib/rbac.ts` and is exposed as `Permission` enum constants.

Notable rule:

> A user can never demote **themselves** to a lower role. The `updateUserRole` action in `src/modules/admin/admin.actions.ts` enforces this with an early check.

---

## The route gate

There is no `middleware.ts` at the root. Instead, **every protected layout and action does its own `auth()` call**:

```ts
// src/app/(dashboard)/layout.tsx
export default async function DashboardLayout({ children }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  // ...
}
```

This is intentional. Middleware at the edge has limitations that hurt small apps (no Prisma, no DB session validation). For a single-process Next.js deployment, checking `auth()` in each Server Component / Server Action is simpler and equally secure. (The SetAuth.js cookie makes this cheap.)

The trade-off: forgetting to check in one place leaves that place open. We rely on:
- Every `(dashboard)` layout page inheriting protection from the layout.
- Every API route under `/api/upload`, `/api/files`, `/api/search` calling `auth()` itself.
- Server Actions in `src/modules/*/` validating `session?.user?.id` (and, when needed, role).

This is documented in [Developer Guide#route-protection](Developer-Guide#route-protection).

---

## Data flow

Three flows cover almost everything:

```
READ:       Server Component ──► Prisma ──► Postgres ──► cached HTML/JSON ──► Client render
WRITE:      Client form ──► Server Action ──► Zod ──► Service ──► Prisma ──► revalidatePath ──► re-render
FILE:       Dropzone ──► /api/upload ──► StorageProvider.put ──► /api/files/[...path] reads back
```

Optimistic UI is reserved for the autosave form (`src/modules/experiences/components/experience-form.tsx`), which uses React 19's `useOptimistic` to update the form state before the action commits.

---

## State management — none

There is no Redux/Zustand/Jotai. Server state lives in the database and is fetched on render. UI state is `useState`/`useReducer` in Client Components.

For the rare cases needing cross-component UI state (e.g. the Cmd+K command dialog), we use React Context (`src/components/shared/command-dialog-provider.tsx`) — local, no library.

This is YAGNI with conviction. If we add offline editing, collaborative drafts, or some other client-collaboration feature, we'll revisit.

---

## Storage layer

`src/modules/uploads/storage.provider.ts` defines the interface:

```ts
interface StorageProvider {
  put(key: string, data: Buffer, metadata: FileMetadata): Promise<StorageResult>
  get(key: string): Promise<Buffer | null>
  delete(key: string): Promise<void>
  getUrl(key: string): string
}
```

The current implementation, `LocalStorageProvider`, writes to `UPLOAD_DIR` on the filesystem. S3 is on the roadmap; adding it means implementing the same interface in a new file and swapping the singleton in `src/modules/uploads/index.ts`.

Files are stored at `{userId}/{experienceId}/{timestamp}-{random}.{ext}`. This is what `/api/files/...` expects and enforces — the first segment must equal the requester's user ID, else `403`.

---

## Frontend styling

- **Tailwind CSS 4** (CSS-based config, not `tailwind.config.ts` token overrides — most tokens live as CSS custom properties in `src/app/globals.css`).
- **shadcn/ui** style primitives copied into `src/components/ui/`. You can edit them in place — they aren't fetched from the registry at build time.
- **lucide-react** for icons.
- **next-themes** for dark/light (dark is default).
- **sonner** for toasts.

The look is dark-first: matte-black background (`#0a0a0a`), emerald accent (`#10b981`). Tokens are duplicated for light mode where used. Color choices live in `src/app/globals.css` as CSS custom properties.

---

## What's deliberately absent

For context, here's the list of things we considered and skipped:

| Idea | Why we skipped |
|------|----------------|
| **Middleware at the root** | Auth in each layout is simpler and sufficient; middleware has edge limitations. |
| **DTO / mapper layer** | Prisma already returns typed rows; adding a mapping layer is busywork. |
| **A dedicated backend service** | Overkill for the user scale; single deploy wins. |
| **S3 from day one** | Local fs works fine for v0.1; abstraction is in place to swap later. |
| **WebSockets / SSE for notifications** | Not yet — bell is on polling. Will revisit when user pain is measurable. |
| **tRPC or GraphQL** | Server Actions give type-safe RPC for free; tRPC/GraphQL would duplicate that. |
| **Multi-tenant** | Each deployment is one instance. Different problem class. |

---

## Where to go next

- **Database schema** → [Database Schema](Database-Schema)
- **Adding a new field** → [Adding an Experience Field](Adding-an-Experience-Field)
- **Testing approach** → [Testing](Testing)
- **Deployment & operations** → [Operating CASAtlas](Operating-CASAtlas)
