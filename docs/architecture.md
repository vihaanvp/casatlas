# CASAtlas Architecture

## Overview

CASAtlas is a single-process monolith built on Next.js with the App Router. There is no separate backend service.

## Architecture

```
┌─────────────────────────────────────────┐
│           Next.js Application            │
│                                          │
│  Server Components → Prisma → PostgreSQL │
│  Server Actions    → Prisma → PostgreSQL │
│  Route Handlers    → Storage → Filesystem│
│  Auth.js           → OAuth Providers     │
└─────────────────────────────────────────┘
```

## Key Decisions

- **React Server Components** by default for zero-client-JS read-only views
- **Server Actions** for mutations (type-safe, no API boilerplate)
- **Route Handlers** only for file uploads and auth callbacks
- **Prisma** for type-safe database access
- **Auth.js** for authentication with OAuth providers
- **StorageProvider** interface for filesystem abstraction

## Module Structure

Features are organized as modules with private components:

```
modules/
├── auth/          # Authentication configuration
├── experiences/   # CAS experience management
├── uploads/       # File upload and storage
├── users/         # User management
└── settings/      # User settings
```

Each module exports:
- Service functions (business logic)
- Server Actions (mutations)
- Types (shared interfaces)
- Components (internal UI)

## Data Flow

1. **Read:** Server Component → Prisma → Database → Render
2. **Write:** Client → Server Action → Service → Prisma → Database → Revalidate → Re-render
3. **Upload:** Client → Route Handler → Storage Provider → Filesystem → Database

## Security

- All server-side validation via Zod schemas
- Ownership checks in service layer (userId in WHERE clauses)
- Auth.js session management with encrypted tokens
- CSRF protection built into Auth.js
- File upload validation (type, size, filename sanitization)
