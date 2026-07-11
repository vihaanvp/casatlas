# ADR 001: Initial Technology Stack

## Status

Accepted

## Context

CASAtlas needs a technology stack that supports:
- Modern web application with server-side rendering
- Type-safe database access
- OAuth authentication
- File upload handling
- Docker deployment
- Excellent developer experience

## Decision

- **Next.js 15** with App Router for full-stack React framework
- **TypeScript** for type safety
- **Tailwind CSS 4** for utility-first styling
- **Prisma** for type-safe ORM
- **PostgreSQL** for relational database
- **Auth.js** for OAuth authentication
- **pnpm** for package management
- **Docker** for deployment

## Consequences

### Positive
- Single codebase for frontend and backend
- React Server Components reduce client-side JavaScript
- Prisma provides type-safe database queries
- Auth.js handles OAuth complexity
- Docker enables consistent deployments

### Negative
- Next.js lock-in (acceptable for this project scope)
- Prisma adds a build step for client generation
- Auth.js v5 is still in beta (acceptable risk)
- PostgreSQL requires a running database service

## Alternatives Considered

1. **Separate frontend/backend:** More complex deployment, unnecessary for this scale
2. **MongoDB:** Less suitable for relational data (users, experiences, evidence)
3. **NextAuth v4:** v5 is the future; starting with v5 avoids migration later
4. **SQLite:** Insufficient for production use with concurrent users
