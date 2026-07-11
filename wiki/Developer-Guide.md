# Developer Guide

This page is for people working **on** CASAtlas — fixing bugs, adding features, or maintaining a fork. If you're here to deploy and use CASAtlas, see [Self-Hosting Overview](Self-Hosting-Overview) instead.

---

## Quick start

```bash
# 1. Clone
git clone https://github.com/vihaanvp/casatlas.git
cd casatlas

# 2. Toolchain — install once
corepack enable       # enables pnpm
pnpm install          # installs deps, runs `prisma generate` via postinstall

# 3. Environment
cp .env.example .env.local
# Edit .env.local — at minimum:
#   DATABASE_URL=postgresql://...
#   AUTH_SECRET=$(openssl rand -base64 32)
#   NEXT_PUBLIC_APP_URL=http://localhost:3000

# 4. Database
pnpm prisma migrate dev    # applies migrations and creates the schema
pnpm db:seed               # optional, currently a no-op

# 5. Dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You'll need at least one OAuth provider configured ([OAuth Setup](OAuth-Setup)) to actually sign in.

---

## Repo map

```
casatlas/
├── prisma/                    Schema + migrations + seed
├── src/
│   ├── app/                   Next.js App Router
│   │   ├── (auth)/            Login / register / error (centered card layout)
│   │   ├── (dashboard)/       Authed pages (sidebar + header layout)
│   │   │   ├── dashboard/     /dashboard
│   │   │   ├── experiences/  /experiences, /experiences/new, /experiences/[id]...
│   │   │   ├── portfolio/     /portfolio (printable)
│   │   │   ├── teacher/       /teacher
│   │   │   ├── admin/         /admin, /admin/users, /admin/audit, /admin/assignments
│   │   │   └── settings/      /settings → /settings/profile etc.
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   Auth.js handler
│   │   │   ├── upload/                File upload
│   │   │   ├── files/[...path]/       Authenticated file serving
│   │   │   └── search/                Cmd+K search
│   │   ├── layout.tsx                Root layout (ThemeProvider, Toaster)
│   │   ├── page.tsx                  / → redirect to /dashboard
│   │   └── globals.css               Tailwind v4 entry
│   │
│   ├── modules/                     Feature modules — each has index.ts as the public face
│   │   ├── auth/                    Auth.js setup + sign-out Action
│   │   ├── experiences/             Core CRUD: actions, service, types, components
│   │   │   └── (private components)
│   │   ├── uploads/                 StorageProvider interface, local implementation, remove-evidence Action
│   │   ├── admin/                   Admin-only actions (user mgmt, teacher assignments, system stats)
│   │   ├── teacher/                 Teacher-scoped actions (review queue, comments)
│   │   └── notifications/           Read actions for the bell icon
│   │
│   ├── components/
│   │   ├── ui/                      shadcn-style primitives (button, card, dialog, sheet, ...)
│   │   ├── layout/                  Sidebar, Header, ThemeToggle
│   │   └── shared/                  Cross-feature buttons/state (FileDropzone, SearchInput, CommandDialog, ...)
│   │
│   ├── hooks/                       React hooks (useDebounce, useAutosave, useUpload, useMediaQuery)
│   ├── lib/                         prisma client, auth helpers, utils, rbac, audit, notifications, constants, errors
│   ├── config/                      Site/auth/upload/features/dashboard config — env-backed
│   └── types/                       Shared global types
│
├── tests/                            Vitest setup (just `setup.ts`)
├── docs/                             Markdown docs (architecture, ADRs)
├── docker/                           Dockerfile + docker-compose.yml
├── prisma/                           Schema and migrations
├── next.config.ts                    CSP / HSTS / etc. headers
├── tailwind.config.ts                Tailwind v4 setup
├── tsconfig.json                     TS6 (no baseUrl, noUncheckedSideEffectImports: false)
├── eslint.config.mjs                 flat config, no FlatCompat
└── package.json                      npm scripts & dependencies
```

---

## Code conventions

### TypeScript

- **Strict mode** is on. No `any` except where explicitly needed (we used to have one in `api/search/route.ts` and replaced it with `Prisma.ExperienceWhereInput` — don't add new ones).
- **ESM** throughout (`"type": "module"` is implicit via `.mjs` and `next.config.ts`).
- `import { x } from "@/lib/..."` — paths use the `@/*` alias defined in `tsconfig.json`.

### React Server vs Client Components

- Default is **Server Component** — no directive.
- Add `"use client"` only when you need: hooks, event handlers, browser APIs, `useState`/`useReducer`.
- The form components for experiences and admin are mostly Client Components (they need autosave/interactivity).
- Layouts are Server Components (they call `auth()`).

### Module public API

Each module gets one **barrel `index.ts`** — the rest of the codebase imports only from `@/modules/xyz` (not `@/modules/xyz/internal-file`).

```ts
// src/modules/experiences/index.ts
export {
  createExperience,
  getExperiences,
  // ...
} from "./experience.actions"
export type { ExperienceCreateInput } from "./experience.types"
```

Internal helpers stay un-exported.

### Service / Action split

- **`actions/`** = `"use server"` files. Validate input, call `auth()`, call `services/`, revalidate cache.
- **`services/`** = Plain TypeScript. No `"use server"` here. Just business logic + Prisma calls. **Reusable from tests** (the service functions are pure exports).
- Tests prefer exercising services directly when feasible.

Example:

```ts
// experience.service.ts — pure, testable
export async function updateExperience(id, userId, data) { /* ... */ }

// experience.actions.ts — wraps service
"use server"
export async function updateExperienceAction(input: ExperienceCreateInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "..." }
  const parsed = experienceCreateSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "...", fieldErrors: ... }
  const updated = await service.updateExperience(/* ... */)
  auditLog({ /* ... */ })
  revalidatePath("/experiences")
  return { success: true, data: updated }
}
```

All Server Actions in this codebase return `ActionResult<T>` (see `src/lib/types.ts` and `src/modules/experiences/experience.types.ts`) — `{ success: true, data }` or `{ success: false, error, fieldErrors? }`.

### Comments

We use **`ponytail:` comments** for rationale. These aren't your typical "// TODO" — they explain *why*, not *what*. Examples live in `src/lib/audit.ts` ("audit log failure must never break the app"), `docker/Dockerfile` ("copy schema so postinstall works"), etc.

If you're adding a `// ponytail:` comment, it should still be useful six months from now, in three sentences or fewer.

### Error handling

- Custom error classes live in `src/lib/errors.ts` (`NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `ConflictError`, `UploadError`).
- Service functions throw typed errors.
- Actions catch everything and convert to `ActionResult`.

### Validation

- Zod 4 schemas in each module's `*.types.ts`.
- Schemas reused on both server (action input) and client (form validation through `@testing-library/react`).

---

## Day-to-day commands

```bash
pnpm dev              # hot-reload Next.js
pnpm build            # production build
pnpm start            # serve the build
pnpm lint             # eslint .
pnpm type-check       # tsc --noEmit
pnpm test             # vitest run
pnpm test:watch       # vitest (watch mode)
pnpm db:migrate       # prisma migrate dev (creates new migrations; dev only)
pnpm db:studio        # prisma studio
pnpm db:seed          # tsx prisma/seed.ts (currently a no-op stub)
```

CI matches this: [lint → type-check → test → build → docker build](Operating-CASAtlas).

---

## Where the things live (mapping)

| You want to... | Look at... |
|----------------|-----------|
| Add a new permission | `src/lib/rbac.ts` |
| Add a new experience status | `prisma/schema.prisma` (enum) + `src/lib/constants.ts` (labels + colors) |
| Add a new audit action | `prisma/schema.prisma` (`AuditAction` enum) + call `auditLog()` in the action |
| Add a new sidebar entry | `src/components/layout/sidebar.tsx` (`studentNav` / `teacherNav` / `adminNav`) |
| Add a new dashboard widget | `src/app/(dashboard)/dashboard/page.tsx` |
| Change file-upload limits | `src/config/upload.ts` and `next.config.ts` (both, not just one) |
| Change the role of the first admin | Bootstrap via SQL — see [Configuration#promoting-your-first-admin](Configuration#promoting-your-first-admin) |

---

## Where to go next

- **Architecture overview** → [Architecture](Architecture)
- **Database schema deep-dive** → [Database Schema](Database-Schema)
- **Adding a new field end-to-end worked example** → [Adding an Experience Field](Adding-an-Experience-Field)
- **Testing conventions** → [Testing](Testing)
