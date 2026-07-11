# Changelog

All notable changes to CASAtlas will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - Unreleased

### Changed

- **TypeScript** upgraded from 5.9 to 6.0.3. Removed deprecated `baseUrl` from tsconfig; added explicit `noUncheckedSideEffectImports: false`
- **Next.js** upgraded from 15.5 to 16.2 with Turbopack as the default bundler
- **Vitest** upgraded from 3.2 to 4.1
- **zod** upgraded from 3.25 to 4.4
- **lucide-react** upgraded from 0.469 to 1.24
- **@types/node** upgraded from 22.20 to 26.1
- **prisma** / **@prisma/client** stay at 6.19 (Prisma 7 blocked by `@auth/prisma-adapter` peer deps)

### Fixed

- `next lint` removed in Next.js 16 — lint script now runs `eslint .` directly
- ESLint config migrated to native flat config (no more `FlatCompat` / circular references)
- Release workflow missing `docker/setup-buildx-action` step (was failing Docker cache export in CI)
- Docker build using `node:20-alpine` (node:26-alpine has corepack issues under BuildKit)
- GitHub Actions major-version bumps: `actions/checkout` 7, `pnpm/action-setup` 6, `actions/setup-node` 6, `docker/setup-buildx-action` 4, `docker/login-action` 4, `docker/metadata-action` 6
- Security advisory for postcss XSS (`< 8.5.10`) — patched via `pnpm.overrides` to `^8.5.10`; lockfile now resolves all postcss instances to the patched version

## [0.1.0] - 2026-07-11

### Added

- **Experience Management**: Create, edit, and organize CAS experiences with rich text
- **Evidence Upload**: Upload images, videos, PDFs, and links as evidence
- **Reflections**: Write rich text reflections for each experience with preview
- **Dashboard**: Track CAS progress with overview statistics and recent activity
- **Teacher Workflow**: Teachers can review, approve, and request revisions on student experiences
- **Admin Panel**: User management with role-based access control (Student, Teacher, Admin)
- **Audit Log**: Track all system actions with detailed audit trail
- **Comments**: Threaded commenting system on experiences
- **Search**: Full-text search across experiences and profiles
- **Dark Mode**: Default dark theme with light mode toggle
- **OAuth Authentication**: Sign in with Google or GitHub (Auth.js v5)
- **Self-Hosted Deployment**: Docker and Docker Compose configuration
- **CI/CD**: GitHub Actions for linting, type-checking, testing, and build verification
- **Dependency Management**: Dependabot configured for npm, Docker, and GitHub Actions

### Known Limitations

- Database migrations require manual `prisma migrate dev` (no automatic migrations in production yet)
- File uploads are stored locally (S3/cloud storage not yet implemented)
- No real-time notifications (polling-based)
- Portfolio export is print-to-PDF only
- No mobile app (responsive web only)
- No internationalization support yet

### Technology Stack

- Next.js 16 (App Router) with React 19
- TypeScript 5.9
- Tailwind CSS 4
- Prisma 6.19 with PostgreSQL 16
- Auth.js v5 (NextAuth)
- Vitest for testing
- Docker multi-stage build
