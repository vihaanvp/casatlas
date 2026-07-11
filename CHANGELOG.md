# Changelog

All notable changes to CASAtlas will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- Next.js 15 (App Router) with React 19
- TypeScript 5.8
- Tailwind CSS 4
- Prisma 6.19 with PostgreSQL 16
- Auth.js v5 (NextAuth)
- Vitest for testing
- Docker multi-stage build
